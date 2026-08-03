import Booking from '../../models/Booking.js';
import GuestHouse from '../../models/GuestHouse.js';
import mongoose from 'mongoose';
import { isObjectId } from '../../utils/isObjectId.js';

/**
 * Executes MongoDB aggregation for "Monthly Revenue by Guest House" report.
 *
 * Two modes:
 *   1. Monthly mode  — supply { guestHouseId, month, year }
 *      Clamps booking stay to the calendar month window.
 *   2. Date range mode — supply { guestHouseId, fromDate, toDate }
 *      Uses the exact date window; month/year are ignored.
 *
 * Revenue per booking = Room.price × (discounted) × nights within the window.
 * Only approved bookings are counted.
 *
 * @param {Object} filters - { guestHouseId, month, year, fromDate, toDate }
 * @returns {Promise<Object>}
 */
export const getMonthlyRevenueByGuestHouseData = async ({ guestHouseId, month, year, fromDate, toDate }) => {
  if (!guestHouseId) throw new Error('Guest House is required for this report');

  const hasDateRange = fromDate && toDate;
  const hasMonthYear = month && year;

  if (!hasDateRange && !hasMonthYear) {
    throw new Error('Either Month + Year or From Date + To Date is required');
  }

  // ── Resolve period window ─────────────────────────────────────────────────
  let periodStart, periodEnd, monthNum, yearNum, mode;

  if (hasDateRange) {
    periodStart = new Date(`${fromDate}T00:00:00.000Z`);
    periodEnd   = new Date(`${toDate}T23:59:59.999Z`);
    if (isNaN(periodStart) || isNaN(periodEnd)) throw new Error('Invalid date range');
    if (periodEnd <= periodStart) throw new Error('To Date must be after From Date');
    mode = 'range';
    // derive month/year from fromDate for display purposes only
    monthNum = periodStart.getUTCMonth() + 1;
    yearNum  = periodStart.getUTCFullYear();
  } else {
    monthNum = parseInt(month, 10);
    yearNum  = parseInt(year,  10);
    if (monthNum < 1 || monthNum > 12 || isNaN(monthNum)) throw new Error('Invalid month value');
    if (yearNum < 2000 || yearNum > 2100 || isNaN(yearNum)) throw new Error('Invalid year value');
    periodStart = new Date(Date.UTC(yearNum, monthNum - 1, 1));
    periodEnd   = new Date(Date.UTC(yearNum, monthNum, 1));
    mode = 'monthly';
  }

  // ── Look up guest house ───────────────────────────────────────────────────
  const isObjId = isObjectId(guestHouseId);
  const guestHouse = await GuestHouse.findOne({
    $or: [
      { guestHouseId },
      ...(isObjId ? [{ _id: guestHouseId }] : []),
    ],
  }).lean();

  if (!guestHouse) throw new Error('Selected guest house not found');

  // Match approved bookings overlapping the window — use ObjectId
  const matchStage = {
    guestHouseId: guestHouse._id,
    status: 'approved',
    checkIn:  { $lt: periodEnd   },
    checkOut: { $gt: periodStart },
  };

  const pipeline = [
    { $match: matchStage },
    { $sort: { checkIn: 1 } },

    {
      $lookup: {
        from: 'rooms',
        localField: 'roomId',
        foreignField: '_id',
        as: 'roomDoc',
      },
    },
    { $unwind: { path: '$roomDoc', preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: 'beds',
        localField: 'bedId',
        foreignField: '_id',
        as: 'bedDoc',
      },
    },
    { $unwind: { path: '$bedDoc', preserveNullAndEmptyArrays: true } },

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
        // Clamp stay to the report window
        effectiveCheckIn:  { $max: ['$checkIn',  new Date(periodStart)] },
        effectiveCheckOut: { $min: ['$checkOut', new Date(periodEnd)]   },
      },
    },

    {
      $addFields: {
        nights: {
          $max: [
            0,
            {
              $divide: [
                { $subtract: ['$effectiveCheckOut', '$effectiveCheckIn'] },
                1000 * 60 * 60 * 24,
              ],
            },
          ],
        },
      },
    },
    { $addFields: { revenue: { $multiply: ['$pricePerNight', '$nights'] } } },
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
    mode,
    fromDate: hasDateRange ? fromDate : null,
    toDate:   hasDateRange ? toDate   : null,
    rows,
    totalRevenue,
    totalNights,
    totalBookings,
  };
};
