import Booking from '../../models/Booking.js';
import GuestHouse from '../../models/GuestHouse.js';
import mongoose from 'mongoose';

/**
 * Executes MongoDB aggregation for "Monthly Revenue by Guest House" report.
 *
 * Revenue per booking = Room.price × number of nights stayed.
 * Only approved bookings are counted.
 *
 * @param {Object} filters - { guestHouseId, month, year }
 * @returns {Promise<Object>} { guestHouse, month, year, rows, totalRevenue, totalNights, totalBookings }
 */
export const getMonthlyRevenueByGuestHouseData = async ({ guestHouseId, month, year }) => {
  if (!guestHouseId) throw new Error('Guest House is required for this report');
  if (!month)       throw new Error('Month is required for this report');
  if (!year)        throw new Error('Year is required for this report');

  const monthNum = parseInt(month, 10);
  const yearNum  = parseInt(year,  10);

  if (monthNum < 1 || monthNum > 12 || Number.isNaN(monthNum)) {
    throw new Error('Invalid month value');
  }
  if (yearNum < 2000 || yearNum > 2100 || Number.isNaN(yearNum)) {
    throw new Error('Invalid year value');
  }

  // Look up guest house
  const isObjectId = mongoose.Types.ObjectId.isValid(guestHouseId);
  const guestHouse = await GuestHouse.findOne({
    $or: [
      { guestHouseId },
      ...(isObjectId ? [{ _id: guestHouseId }] : []),
    ],
  }).lean();

  if (!guestHouse) throw new Error('Selected guest house not found');

  const targetGuestHouseId = guestHouse.guestHouseId;

  // Month window in UTC
  const periodStart = new Date(Date.UTC(yearNum, monthNum - 1, 1));           // 1st of month 00:00 UTC
  const periodEnd   = new Date(Date.UTC(yearNum, monthNum, 1));                // 1st of next month 00:00 UTC

  // Match approved bookings that overlap with this month
  // A booking overlaps the month if checkIn < periodEnd AND checkOut > periodStart
  const matchStage = {
    guestHouseId: targetGuestHouseId,
    status: 'approved',
    checkIn:  { $lt: periodEnd   },
    checkOut: { $gt: periodStart },
  };

  const pipeline = [
    { $match: matchStage },
    { $sort: { checkIn: 1 } },

    // Join room to get price and room details
    {
      $lookup: {
        from: 'rooms',
        localField: 'roomId',
        foreignField: '_id',
        as: 'roomDoc',
      },
    },
    { $unwind: { path: '$roomDoc', preserveNullAndEmptyArrays: true } },

    // Join bed for bed number
    {
      $lookup: {
        from: 'beds',
        localField: 'bedId',
        foreignField: '_id',
        as: 'bedDoc',
      },
    },
    { $unwind: { path: '$bedDoc', preserveNullAndEmptyArrays: true } },

    // Join user for guest name
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userDoc',
      },
    },
    { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },

    {
      $project: {
        _id: 1,
        bookingNo: { $substr: [{ $toString: '$_id' }, 18, 6] },
        guestName: {
          $trim: {
            input: {
              $concat: [
                { $ifNull: ['$userDoc.firstName', { $ifNull: ['$fullName', ''] }] },
                ' ',
                { $ifNull: ['$userDoc.lastName', ''] },
              ],
            },
          },
        },
        guestPhone: { $ifNull: ['$userDoc.phone', '$phone'] },
        roomNumber: '$roomDoc.roomNumber',
        roomType:   '$roomDoc.roomType',
        bedNumber:  '$bedDoc.bedNumber',
        originalPrice:      { $ifNull: ['$roomDoc.price', 0] },
        discountPercentage: { $ifNull: ['$roomDoc.discountPercentage', 0] },
        // Effective price after discount: price - (price × discount / 100)
        pricePerNight: {
          $let: {
            vars: {
              p: { $ifNull: ['$roomDoc.price', 0] },
              d: { $ifNull: ['$roomDoc.discountPercentage', 0] },
            },
            in: {
              $subtract: [
                '$$p',
                { $divide: [{ $multiply: ['$$p', '$$d'] }, 100] },
              ],
            },
          },
        },
        checkIn:  1,
        checkOut: 1,
        status:   1,

        // Clamp stay to the report month window, then compute nights
        effectiveCheckIn: {
          $max: ['$checkIn', new Date(periodStart)],
        },
        effectiveCheckOut: {
          $min: ['$checkOut', new Date(periodEnd)],
        },
      },
    },

    // Compute nights within month and revenue
    {
      $addFields: {
        nights: {
          $max: [
            0,
            {
              $divide: [
                { $subtract: ['$effectiveCheckOut', '$effectiveCheckIn'] },
                1000 * 60 * 60 * 24, // ms → days
              ],
            },
          ],
        },
      },
    },
    {
      $addFields: {
        revenue: { $multiply: ['$pricePerNight', '$nights'] },
      },
    },

    // Filter out zero-night results (edge cases)
    { $match: { nights: { $gt: 0 } } },
  ];

  const rows = await Booking.aggregate(pipeline);

  const totalRevenue  = rows.reduce((sum, r) => sum + (r.revenue || 0), 0);
  const totalNights   = rows.reduce((sum, r) => sum + (r.nights  || 0), 0);
  const totalBookings = rows.length;

  return {
    guestHouse,
    month: monthNum,
    year: yearNum,
    rows,
    totalRevenue,
    totalNights,
    totalBookings,
  };
};
