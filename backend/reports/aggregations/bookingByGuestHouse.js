import Booking from '../../models/Booking.js';
import GuestHouse from '../../models/GuestHouse.js';
import mongoose from 'mongoose';
import { isObjectId } from '../../utils/isObjectId.js';

/**
 * Executes MongoDB aggregation for "Booking by Guest House" report.
 *
 * @param {Object} filters - { guestHouseId, fromDate, toDate }
 * @returns {Promise<Object>} { guestHouse, bookings }
 */
export const getBookingByGuestHouseData = async ({ guestHouseId, fromDate, toDate }) => {
  if (!guestHouseId) {
    throw new Error("Guest House is required for this report");
  }

  // Look up guest house details
  const isObjId = isObjectId(guestHouseId);
  const guestHouse = await GuestHouse.findOne({
    $or: [
      { guestHouseId },
      ...(isObjId ? [{ _id: guestHouseId }] : []),
    ],
  }).lean();

  if (!guestHouse) {
    throw new Error("Selected guest house not found");
  }

  // Build match criteria — use ObjectId
  const matchStage = {
    guestHouseId: guestHouse._id,
  };

  if (fromDate || toDate) {
    matchStage.$and = [];
    if (fromDate) {
      const start = new Date(`${fromDate}T00:00:00.000Z`);
      if (!Number.isNaN(start.getTime())) {
        matchStage.$and.push({ checkOut: { $gte: start } });
      }
    }
    if (toDate) {
      const end = new Date(`${toDate}T23:59:59.999Z`);
      if (!Number.isNaN(end.getTime())) {
        matchStage.$and.push({ checkIn: { $lte: end } });
      }
    }
  }

  // MongoDB Aggregation Pipeline
  const pipeline = [
    { $match: matchStage },
    { $sort: { checkIn: 1, createdAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userDoc",
      },
    },
    {
      $unwind: {
        path: "$userDoc",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "roomId",
        foreignField: "_id",
        as: "roomDoc",
      },
    },
    {
      $unwind: {
        path: "$roomDoc",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "beds",
        localField: "bedId",
        foreignField: "_id",
        as: "bedDoc",
      },
    },
    {
      $unwind: {
        path: "$bedDoc",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        bookingNo: { $substr: [{ $toString: "$_id" }, 18, 6] },
        guestName: {
          $concat: [
            { $ifNull: ["$userDoc.firstName", "$fullName"] },
            " ",
            { $ifNull: ["$userDoc.lastName", ""] },
          ],
        },
        guestEmail: { $ifNull: ["$userDoc.email", "$email"] },
        guestPhone: { $ifNull: ["$userDoc.phone", "$phone"] },
        roomNumber: "$roomDoc.roomNumber",
        roomType: "$roomDoc.roomType",
        bedNumber: "$bedDoc.bedNumber",
        bedType: "$bedDoc.bedType",
        checkIn: 1,
        checkOut: 1,
        status: 1,
        createdAt: 1,
        specialRequests: 1,
      },
    },
  ];

  const bookings = await Booking.aggregate(pipeline);

  return {
    guestHouse,
    bookings,
  };
};
