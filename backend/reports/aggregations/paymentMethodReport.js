import Invoice from '../../models/Invoice.js';

/**
 * Aggregation for "Payment Method Wise Report".
 *
 * Fetches all invoice transactions filtered by one or more payment methods
 * and an optional date range. Joins Booking → User → Room → GuestHouse.
 *
 * @param {Object} filters
 * @param {string[]} filters.paymentMethods  - e.g. ['Cash', 'UPI']
 * @param {string}   [filters.fromDate]      - YYYY-MM-DD
 * @param {string}   [filters.toDate]        - YYYY-MM-DD
 * @returns {Promise<{ rows: Object[], totals: Object }>}
 */
export const getPaymentMethodReportData = async ({ paymentMethods, fromDate, toDate }) => {
  if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
    throw new Error('At least one payment method is required');
  }

  // ── Stage 1: match invoices by payment method and optional date range ───
  const matchStage = {
    'invoiceData.paymentMethod': { $in: paymentMethods },
  };

  if (fromDate || toDate) {
    matchStage.createdAt = {};
    if (fromDate) matchStage.createdAt.$gte = new Date(`${fromDate}T00:00:00.000Z`);
    if (toDate)   matchStage.createdAt.$lte = new Date(`${toDate}T23:59:59.999Z`);
  }

  const pipeline = [
    { $match: matchStage },
    { $sort: { createdAt: -1 } },

    // Join Booking
    {
      $lookup: {
        from: 'bookings',
        let: { bookingId: '$bookingId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$bookingId'] } } },
          { $project: { userId: 1, guestHouseId: 1, roomId: 1, checkIn: 1, checkOut: 1, status: 1 } },
        ],
        as: 'booking',
      },
    },
    { $addFields: { booking: { $arrayElemAt: ['$booking', 0] } } },

    // Join User (guest)
    {
      $lookup: {
        from: 'users',
        let: { userId: '$booking.userId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
          { $project: { firstName: 1, lastName: 1, phone: 1, email: 1 } },
        ],
        as: 'userDoc',
      },
    },
    { $addFields: { userDoc: { $arrayElemAt: ['$userDoc', 0] } } },

    // Join Room
    {
      $lookup: {
        from: 'rooms',
        let: { roomId: '$booking.roomId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$roomId'] } } },
          { $project: { roomNumber: 1 } },
        ],
        as: 'roomDoc',
      },
    },
    { $addFields: { roomDoc: { $arrayElemAt: ['$roomDoc', 0] } } },

    // Join GuestHouse (ObjectId → _id)
    {
      $lookup: {
        from: 'guesthouses',
        let: { ghId: '$booking.guestHouseId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$ghId'] } } },
          { $project: { guestHouseName: 1, location: 1 } },
        ],
        as: 'ghDoc',
      },
    },
    { $addFields: { ghDoc: { $arrayElemAt: ['$ghDoc', 0] } } },

    // Project final shape
    {
      $project: {
        _id: 1,
        bookingId: 1,
        createdAt: 1,
        paymentMethod:     '$invoiceData.paymentMethod',
        amountPaid:        '$amountPaid',
        bookingTotal:      '$invoiceData.bookingTotal',
        outstandingBalance:'$invoiceData.outstandingBalance',
        taxesTotal:        '$taxesTotal',
        guestName: {
          $trim: {
            input: {
              $concat: [
                { $ifNull: ['$userDoc.firstName', ''] },
                ' ',
                { $ifNull: ['$userDoc.lastName', ''] },
              ],
            },
          },
        },
        guestPhone:    { $ifNull: ['$userDoc.phone', '—'] },
        roomNumber:    { $ifNull: ['$roomDoc.roomNumber', '—'] },
        guestHouseName:{ $ifNull: ['$ghDoc.guestHouseName', '—'] },
        checkIn:  '$booking.checkIn',
        checkOut: '$booking.checkOut',
      },
    },

    // Summary facet — totals per payment method + grand total
    {
      $facet: {
        rows: [{ $sort: { paymentMethod: 1, createdAt: -1 } }],
        totals: [
          {
            $group: {
              _id: '$paymentMethod',
              totalPaid:  { $sum: '$amountPaid' },
              count:      { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ];

  const [result] = await Invoice.aggregate(pipeline);
  return {
    rows:   result?.rows   || [],
    totals: result?.totals || [],
  };
};
