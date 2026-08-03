import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import GuestHouse from '../models/GuestHouse.js';
import User from '../models/User.js';
import { isObjectId } from '../utils/isObjectId.js';

export const createPayment = async (req, res) => {
  try {
    const { bookingId, amountPaid, paymentMethod, taxesTotal, taxBreakdown, invoiceId } = req.body;
    if (!bookingId || amountPaid == null) return res.status(400).json({ message: 'bookingId and amountPaid required' });

    // ensure booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const payment = await Payment.create({
      bookingId, amountPaid: Number(amountPaid), paymentMethod, taxesTotal: Number(taxesTotal) || 0, taxBreakdown: taxBreakdown || [], createdBy: req.user?._id,
    });

    // create invoice document if invoice payload provided
    let invoiceDoc = null;
    try {
      const invoicePayload = req.body.invoice || {};
      invoiceDoc = await Invoice.create({
        bookingId,
        paymentId: payment._id,
        invoiceData: invoicePayload,
        amountPaid: Number(amountPaid),
        taxesTotal: Number(taxesTotal) || 0,
        taxBreakdown: invoicePayload.taxBreakdown || taxBreakdown || [],
        createdBy: req.user?._id,
      });

      // set invoiceId to the document's ObjectId for consistency
      invoiceDoc.invoiceId = invoiceDoc._id;
      await invoiceDoc.save();

      // link invoice id to payment
      payment.invoiceId = invoiceDoc._id;
      await payment.save();
    } catch (invErr) {
      console.error('Failed to create invoice document:', invErr);
    }

    // mark booking as checked out
    booking.isCheckedOut = true;
    await booking.save();

    return res.status(201).json({ payment, booking, invoice: invoiceDoc });
  } catch (err) {
    console.error('Error creating payment:', err);
    return res.status(500).json({ message: 'Unable to create payment' });
  }
};

export const getInvoiceByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required' });
    }

    const invoice = await Invoice.findOne({ bookingId }).sort({ createdAt: -1 });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found for this booking' });
    }

    return res.json({
      invoice: invoice.invoiceData || null,
      invoiceDoc: invoice,
    });
  } catch (err) {
    console.error('Error fetching invoice:', err);
    return res.status(500).json({ message: 'Unable to fetch invoice' });
  }
};

export const listOutstandingReceipts = async (req, res) => {
  try {
    const body = req.method === 'POST' ? req.body : req.query;
    const { search = '', fromDate = '', toDate = '', paid = false } = body;

    // Scope to assigned guest house
    const assignedGH = req.user?.assignedGuestHouseId;
    const scopedGuestHouseId = assignedGH ? (assignedGH.guestHouseId || assignedGH) : null;
    let scopedGuestHouseObjectId = null;
    if (scopedGuestHouseId) {
      const isObjId = isObjectId(scopedGuestHouseId);
      const gh = await GuestHouse.findOne({
        $or: [{ guestHouseId: scopedGuestHouseId }, ...(isObjId ? [{ _id: scopedGuestHouseId }] : [])],
      }).lean();
      if (gh) scopedGuestHouseObjectId = gh._id;
    }

    // ── PAID MODE: query Invoice collection — one row per outstanding transaction ──
    if (paid) {
      // Match bookings scoped to guest house / search
      const bookingMatch = { isCheckedOut: true };
      if (scopedGuestHouseObjectId) bookingMatch.guestHouseId = scopedGuestHouseObjectId;
      if (fromDate || toDate) {
        bookingMatch.checkIn = {};
        if (fromDate) bookingMatch.checkIn.$gte = new Date(`${fromDate}T00:00:00.000Z`);
        if (toDate)   bookingMatch.checkIn.$lte = new Date(`${toDate}T23:59:59.999Z`);
      }
      if (search && search.trim()) {
        const re = { $regex: search.trim(), $options: 'i' };
        const users = await User.find({ role: 'USER', $or: [{ firstName: re }, { lastName: re }, { phone: re }, { email: re }] }, '_id').lean();
        bookingMatch.userId = { $in: users.map((u) => u._id) };
      }

      // Get qualifying booking IDs
      const bookings = await Booking.find(bookingMatch, '_id').lean();
      const bookingIds = bookings.map((b) => b._id);

      if (bookingIds.length === 0) return res.json({ receipts: [] });

      // For each booking, find its FIRST invoice (checkout) by createdAt asc
      // Then return all subsequent invoices (outstanding payments) — one doc per transaction
      const pipeline = [
        { $match: { bookingId: { $in: bookingIds } } },
        { $sort: { bookingId: 1, createdAt: 1 } },

        // Rank invoices per booking: 1 = checkout invoice, 2+ = outstanding payments
        {
          $setWindowFields: {
            partitionBy: '$bookingId',
            sortBy: { createdAt: 1 },
            output: { invoiceRank: { $rank: {} } },
          },
        },

        // Keep only outstanding payment invoices (rank >= 2)
        { $match: { invoiceRank: { $gte: 2 } } },

        // Join booking
        {
          $lookup: {
            from: 'bookings',
            let: { bookingId: '$bookingId' },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$bookingId'] } } },
              {
                $lookup: {
                  from: 'users',
                  let: { uid: '$userId' },
                  pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$uid'] } } },
                    { $project: { firstName: 1, lastName: 1, email: 1, phone: 1 } },
                  ],
                  as: 'userDoc',
                },
              },
              { $addFields: { userId: { $arrayElemAt: ['$userDoc', 0] } } },
              { $unset: 'userDoc' },
              {
                $lookup: {
                  from: 'rooms',
                  let: { rid: '$roomId' },
                  pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$rid'] } } },
                    { $project: { roomNumber: 1 } },
                  ],
                  as: 'roomDoc',
                },
              },
              { $addFields: { roomId: { $arrayElemAt: ['$roomDoc', 0] } } },
              { $unset: 'roomDoc' },
            ],
            as: 'bookingDoc',
          },
        },
        { $addFields: { bookingDoc: { $arrayElemAt: ['$bookingDoc', 0] } } },

        { $sort: { createdAt: -1 } },

        {
          $project: {
            _id: 1,
            bookingId: 1,
            createdAt: 1,
            outstandingBalance: '$invoiceData.outstandingBalance',
            invoiceData: {
              $mergeObjects: [
                '$invoiceData',
                { previouslyPaid: { $subtract: ['$invoiceData.amountPaid', '$amountPaid'] } },
                { amountPaid: '$amountPaid' }, // this transaction only
              ],
            },
            booking: '$bookingDoc',
          },
        },
      ];

      const receipts = await Invoice.aggregate(pipeline);
      return res.json({ receipts });
    }

    // ── UNPAID MODE: query Bookings — one row per booking with outstanding balance ──
    const matchStage = { isCheckedOut: true };
    if (scopedGuestHouseObjectId) matchStage.guestHouseId = scopedGuestHouseObjectId;
    if (fromDate || toDate) {
      matchStage.checkIn = {};
      if (fromDate) matchStage.checkIn.$gte = new Date(`${fromDate}T00:00:00.000Z`);
      if (toDate)   matchStage.checkIn.$lte = new Date(`${toDate}T23:59:59.999Z`);
    }
    if (search && search.trim()) {
      const re = { $regex: search.trim(), $options: 'i' };
      const users = await User.find({ role: 'USER', $or: [{ firstName: re }, { lastName: re }, { phone: re }, { email: re }] }, '_id').lean();
      matchStage.userId = { $in: users.map((u) => u._id) };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'invoices',
          let: { bookingId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$bookingId', '$$bookingId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { invoiceData: 1, amountPaid: 1, createdAt: 1 } },
          ],
          as: 'latestInvoice',
        },
      },
      { $addFields: { latestInvoice: { $arrayElemAt: ['$latestInvoice', 0] } } },
      { $match: { 'latestInvoice.invoiceData.outstandingBalance': { $gt: 0 } } },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$userId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
            { $project: { firstName: 1, lastName: 1, email: 1, phone: 1 } },
          ],
          as: 'userDoc',
        },
      },
      { $addFields: { userId: { $arrayElemAt: ['$userDoc', 0] } } },
      { $unset: 'userDoc' },
      { $sort: { checkIn: -1 } },
      {
        $addFields: {
          bookingId: '$_id',
          outstandingBalance: '$latestInvoice.invoiceData.outstandingBalance',
        },
      },
      { $unset: 'latestInvoice' },
      {
        $group: {
          _id: '$_id',
          bookingId:          { $first: '$_id' },
          outstandingBalance: { $first: '$outstandingBalance' },
          createdAt:          { $first: '$createdAt' },
          checkIn:            { $first: '$checkIn' },
          checkOut:           { $first: '$checkOut' },
          guestHouseId:       { $first: '$guestHouseId' },
          status:             { $first: '$status' },
          userId:             { $first: '$userId' },
          roomId:             { $first: '$roomId' },
          roomIds:            { $first: '$roomIds' },
          bedId:              { $first: '$bedId' },
          isCheckedOut:       { $first: '$isCheckedOut' },
          familyMembers:      { $first: '$familyMembers' },
          specialRequests:    { $first: '$specialRequests' },
        },
      },
      {
        $addFields: {
          booking: {
            _id: '$_id', checkIn: '$checkIn', checkOut: '$checkOut',
            guestHouseId: '$guestHouseId', status: '$status', userId: '$userId',
            roomId: '$roomId', roomIds: '$roomIds', bedId: '$bedId',
            isCheckedOut: '$isCheckedOut', familyMembers: '$familyMembers',
            specialRequests: '$specialRequests',
          },
        },
      },
      { $project: { _id: 1, bookingId: 1, outstandingBalance: 1, createdAt: 1, booking: 1 } },
    ];

    const receipts = await Booking.aggregate(pipeline);
    return res.json({ receipts });
  } catch (err) {
    console.error('Error listing outstanding receipts:', err);
    return res.status(500).json({ message: 'Unable to fetch outstanding receipts' });
  }
};

export const listPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    return res.json({ payments });
  } catch (err) {
    console.error('Error listing payments:', err);
    return res.status(500).json({ message: 'Unable to fetch payments' });
  }
};

export const listCheckedOutBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, guestHouseId, search = '' } = req.body;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Scope to assigned guest house for non-super-admin
    const assignedGH = req.user?.assignedGuestHouseId;
    const rawGHId = guestHouseId || (assignedGH ? (assignedGH.guestHouseId || assignedGH) : null);

    let scopedGHObjectId = null;
    if (rawGHId) {
      const isObjId = isObjectId(rawGHId);
      const gh = await GuestHouse.findOne({
        $or: [
          { guestHouseId: rawGHId },
          ...(isObjId ? [{ _id: rawGHId }] : []),
        ],
      }).lean();
      if (gh) scopedGHObjectId = gh._id;
    }

    // ── Stage 1: match checked-out bookings ──────────────────────────
    const matchStage = { isCheckedOut: true };
    if (scopedGHObjectId) matchStage.guestHouseId = scopedGHObjectId;
    if (search && search.trim()) {
      const s = search.trim();
      const re = { $regex: s, $options: 'i' };
      const users = await User.find({ role: 'USER', $or: [{ firstName: re }, { lastName: re }, { phone: re }, { email: re }] }, '_id').lean();
      matchStage.userId = { $in: users.map((u) => u._id) };
    }

    const pipeline = [
      { $match: matchStage },

      // ── Stage 2: join latest invoice for each booking ────────────────
      {
        $lookup: {
          from: 'invoices',
          let: { bookingId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$bookingId', '$$bookingId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                _id: 1,
                invoiceData: 1,
                amountPaid: 1,
                taxesTotal: 1,
                taxBreakdown: 1,
                createdAt: 1,
              },
            },
          ],
          as: 'invoice',
        },
      },
      // Flatten array → single object (null if no invoice)
      { $addFields: { invoice: { $arrayElemAt: ['$invoice', 0] } } },

      // ── Stage 3: join guest user ─────────────────────────────────────
      {
        $lookup: {
          from: 'users',
          let: { userId: '$userId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
            { $project: { firstName: 1, lastName: 1, email: 1, phone: 1 } },
          ],
          as: 'userId',
        },
      },
      { $addFields: { userId: { $arrayElemAt: ['$userId', 0] } } },

      // ── Stage 4: join primary room ───────────────────────────────────
      {
        $lookup: {
          from: 'rooms',
          let: { roomId: '$roomId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$roomId'] } } },
            { $project: { roomNumber: 1 } },
          ],
          as: 'roomId',
        },
      },
      { $addFields: { roomId: { $arrayElemAt: ['$roomId', 0] } } },

      // ── Stage 5: join roomIds array (multi-room bookings) ────────────
      {
        $lookup: {
          from: 'rooms',
          let: { roomIds: '$roomIds' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', { $ifNull: ['$$roomIds', []] }] } } },
            { $project: { roomNumber: 1 } },
          ],
          as: 'roomIds',
        },
      },

      // ── Stage 6: join bed ────────────────────────────────────────────
      {
        $lookup: {
          from: 'beds',
          let: { bedId: '$bedId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$bedId'] } } },
            { $project: { bedNumber: 1, bedType: 1 } },
          ],
          as: 'bedId',
        },
      },
      { $addFields: { bedId: { $arrayElemAt: ['$bedId', 0] } } },

      // ── Stage 7: join guest house (ObjectId → _id join) ─────────────
      {
        $lookup: {
          from: 'guesthouses',
          let: { ghId: '$guestHouseId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$ghId'] } } },
            { $project: { guestHouseId: 1, guestHouseName: 1, location: 1 } },
          ],
          as: 'guestHouseDoc',
        },
      },
      {
        $addFields: {
          guestHouseId: {
            $ifNull: [
              { $arrayElemAt: ['$guestHouseDoc', 0] },
              { guestHouseName: '$guestHouseId' },
            ],
          },
        },
      },
      { $unset: 'guestHouseDoc' },

      // ── Stage 8: sort ────────────────────────────────────────────────
      { $sort: { checkOut: -1 } },

      // ── Stage 9: facet for data + count in one round-trip ────────────
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limitNum },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await Booking.aggregate(pipeline);

    const bookings = result.data || [];
    const totalCount = result.totalCount?.[0]?.count || 0;

    return res.json({
      bookings,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
    });
  } catch (err) {
    console.error('Error listing checked-out bookings:', err);
    return res.status(500).json({ message: 'Unable to fetch checked-out bookings' });
  }
};
