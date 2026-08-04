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

    const payAmt = Number(amountPaid) || 0;
    const taxesAmt = Number(taxesTotal) || 0;

    const payment = await Payment.create({
      bookingId,
      amountPaid: payAmt,
      paymentMethod,
      taxesTotal: taxesAmt,
      taxBreakdown: taxBreakdown || [],
      createdBy: req.user?._id,
    });

    // create or UPDATE invoice document (ONE invoice per booking)
    let invoiceDoc = null;
    try {
      const invoicePayload = req.body.invoice || {};

      // Check if invoice already exists for this booking
      const existingInvoice = await Invoice.findOne({ bookingId }).sort({ createdAt: 1 });

      if (existingInvoice) {
        // ── OUTSTANDING PAYMENT: UPDATE EXISTING INVOICE ──
        const prevPaid = Number(existingInvoice.paidAmount) || Number(existingInvoice.amountPaid) || 0;
        const newPaid = prevPaid + payAmt;
        const totalAmt = Number(existingInvoice.totalAmount)
          || Number(invoicePayload.bookingTotal)
          || Number(existingInvoice.invoiceData?.bookingTotal)
          || 0;
        const newOutstanding = Math.max(0, totalAmt - newPaid);

        // Top-level fields (new flattened schema)
        existingInvoice.paidAmount = newPaid;
        existingInvoice.outstandingAmount = newOutstanding;
        if (paymentMethod) existingInvoice.paymentMethod = paymentMethod;
        if (taxesAmt) existingInvoice.taxAmount = taxesAmt;
        if (taxBreakdown?.length) existingInvoice.taxBreakdown = taxBreakdown;
        if (req.body.note) existingInvoice.notes = req.body.note;

        // Add payment to paymentIds (no duplicates)
        if (!existingInvoice.paymentIds.map(String).includes(String(payment._id))) {
          existingInvoice.paymentIds.push(payment._id);
        }

        // Legacy fields (sync invoiceData for backward compat)
        existingInvoice.amountPaid = newPaid;
        existingInvoice.taxesTotal = taxesAmt || existingInvoice.taxesTotal;
        existingInvoice.invoiceData = {
          ...(existingInvoice.invoiceData || {}),
          ...invoicePayload,
          amountPaid: newPaid,
          outstandingBalance: newOutstanding,
          bookingTotal: totalAmt || invoicePayload.bookingTotal || existingInvoice.invoiceData?.bookingTotal,
        };
        if (!existingInvoice.invoiceId) existingInvoice.invoiceId = existingInvoice._id;

        await existingInvoice.save();
        invoiceDoc = existingInvoice;
      } else {
        // ── CHECKOUT PAYMENT: CREATE NEW INVOICE ──
        const totalAmt = Number(invoicePayload.bookingTotal) || 0;
        const initOutstanding = Math.max(0, totalAmt - payAmt);

        const taxBd = invoicePayload.taxBreakdown || taxBreakdown || [];
        invoiceDoc = await Invoice.create({
          bookingId,
          paymentId: payment._id,
          invoiceId: undefined, // will be set to _id by pre-save hook
          // ── Flattened fields (new schema) ──
          totalAmount: totalAmt,
          taxAmount: taxesAmt,
          taxBreakdown: taxBd,
          extrasTotal: Number(invoicePayload.extrasTotal) || 0,
          paidAmount: payAmt,
          outstandingAmount: initOutstanding,
          discountAmount: Number(invoicePayload.discount) || 0,
          paymentMethod,
          notes: req.body.note || invoicePayload.note,
          paymentIds: [payment._id],
          createdBy: req.user?._id,
          // ── Legacy fields (for backward compat) ──
          invoiceData: {
            ...invoicePayload,
            amountPaid: payAmt,
            outstandingBalance: initOutstanding,
          },
          amountPaid: payAmt,
          taxesTotal: taxesAmt,
        });

        invoiceDoc.invoiceId = invoiceDoc._id;
        await invoiceDoc.save();
      }

      // link invoice id to payment
      payment.invoiceId = invoiceDoc._id;
      await payment.save();
    } catch (invErr) {
      console.error('Failed to create/update invoice document:', invErr);
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

    const rawInvoice = await Invoice.findOne({ bookingId }).sort({ createdAt: -1 });

    if (!rawInvoice) {
      return res.status(404).json({ message: 'Invoice not found for this booking' });
    }

    // Merge legacy invoiceData with new top-level fields (top-level takes precedence)
    const legacy = rawInvoice.invoiceData || {};
    const mergedInvoiceData = {
      ...legacy,
      id: rawInvoice._id,
      bookingTotal: rawInvoice.totalAmount ?? legacy.bookingTotal,
      taxesTotal: rawInvoice.taxAmount ?? rawInvoice.taxesTotal ?? legacy.taxesTotal,
      taxBreakdown: rawInvoice.taxBreakdown?.length ? rawInvoice.taxBreakdown : legacy.taxBreakdown,
      extrasTotal: rawInvoice.extrasTotal ?? legacy.extrasTotal,
      amountPaid: rawInvoice.paidAmount ?? rawInvoice.amountPaid ?? legacy.amountPaid,
      outstandingBalance: rawInvoice.outstandingAmount ?? legacy.outstandingBalance,
      discount: rawInvoice.discountAmount ?? legacy.discount,
      paymentMethod: rawInvoice.paymentMethod ?? legacy.paymentMethod,
      note: rawInvoice.notes ?? legacy.note,
      createdAt: rawInvoice.createdAt,
      updatedAt: rawInvoice.updatedAt,
      paymentIds: rawInvoice.paymentIds,
    };

    return res.json({
      invoice: mergedInvoiceData,
      invoiceDoc: rawInvoice,
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

    // ── PAID MODE: query Payment collection — one row per payment transaction ──
    if (paid) {
      // Step 1: match bookings scoped to guest house / search
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

      // Step 2: find qualifying bookings
      const bookings = await Booking.find(bookingMatch, '_id').lean();
      const bookingIds = bookings.map((b) => b._id);
      if (bookingIds.length === 0) return res.json({ receipts: [] });

      // Step 3: for each booking, find its invoice (to get cumulative amounts)
      const invoices = await Invoice.find({ bookingId: { $in: bookingIds } }, {
        bookingId: 1, totalAmount: 1, paidAmount: 1, outstandingAmount: 1,
        invoiceData: 1, amountPaid: 1, taxesTotal: 1, taxBreakdown: 1,
        createdAt: 1, paymentIds: 1,
      }).lean();
      const invByBooking = {};
      invoices.forEach((inv) => { invByBooking[String(inv.bookingId)] = inv; });

      // Step 4: find all payments (except first/initial checkout payment per booking if
      //         outstandingBalance after first is still owed, we need to include subsequent ones)
      //         Actually, simpler: we include ALL payments that happened AFTER the booking was
      //         checked out, and for each booking we compute "previouslyPaid" as cumulative
      //         up to (but not including) this payment.
      //         To get "paid outstanding" (not initial) payments: exclude the FIRST payment
      //         per booking (since first payment is always at checkout).
      //         This matches the OLD behavior of invoiceRank >= 2!
      const allPayments = await Payment.find({ bookingId: { $in: bookingIds } }).sort({ createdAt: 1 }).lean();

      // Group payments by bookingId
      const paymentsByBooking = {};
      allPayments.forEach((p) => {
        const k = String(p.bookingId);
        if (!paymentsByBooking[k]) paymentsByBooking[k] = [];
        paymentsByBooking[k].push(p);
      });

      // Rank payments per booking: 1 = checkout, 2+ = outstanding (keep 2+)
      // Also calculate "previouslyPaid" = sum of all payments before this one
      const outstandingPayments = [];
      Object.keys(paymentsByBooking).forEach((bookingId) => {
        const payments = paymentsByBooking[bookingId];
        let cumulative = 0;
        payments.forEach((p, idx) => {
          const rank = idx + 1;
          if (rank >= 2) {
            // Build invoiceData for this row
            const inv = invByBooking[bookingId];
            const legacy = inv?.invoiceData || {};
            const totalBill = inv?.totalAmount ?? legacy.bookingTotal ?? 0;
            const currentOutstanding = inv?.outstandingAmount ?? legacy.outstandingBalance ?? 0;

            outstandingPayments.push({
              _id: p._id,
              bookingId: p.bookingId,
              createdAt: p.createdAt,
              outstandingBalance: currentOutstanding,
              // Payment transaction details
              invoiceData: {
                ...legacy,
                bookingTotal: totalBill,
                paymentMethod: p.paymentMethod || inv?.paymentMethod || '',
                amountPaid: p.amountPaid,          // THIS TRANSACTION ONLY
                previouslyPaid: cumulative,        // sum of all before (checkout + prior outstandings)
                taxesTotal: p.taxesTotal || inv?.taxAmount || 0,
                taxBreakdown: p.taxBreakdown || inv?.taxBreakdown || [],
                outstandingBalance: currentOutstanding,
                createdAt: p.createdAt,
              },
              booking: null, // filled in by join below
            });
          }
          cumulative += Number(p.amountPaid) || 0;
        });
      });

      if (outstandingPayments.length === 0) return res.json({ receipts: [] });

      // Step 5: Now join booking + user + room (same as before) via Mongoose queries
      const pmtBookingIds = outstandingPayments.map((r) => r.bookingId);
      const bookingsWithJoins = await Booking.find({ _id: { $in: pmtBookingIds } })
        .populate('userId', 'firstName lastName email phone')
        .populate('roomId', 'roomNumber')
        .populate('roomIds', 'roomNumber')
        .lean();
      const bookingMap = {};
      bookingsWithJoins.forEach((b) => { bookingMap[String(b._id)] = b; });

      // Attach booking to each outstandingPayment row
      const receipts = outstandingPayments
        .map((p) => ({
          ...p,
          booking: bookingMap[String(p.bookingId)] || null,
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
            {
              $addFields: {
                // Compute normalized outstandingBalance: prefer top-level outstandingAmount
                normalizedOutstanding: {
                  $ifNull: [
                    '$outstandingAmount',
                    { $ifNull: ['$invoiceData.outstandingBalance', 0] }
                  ]
                },
              },
            },
            { $project: { invoiceData: 1, amountPaid: 1, paidAmount: 1, outstandingAmount: 1, normalizedOutstanding: 1, createdAt: 1 } },
          ],
          as: 'latestInvoice',
        },
      },
      { $addFields: { latestInvoice: { $arrayElemAt: ['$latestInvoice', 0] } } },
      { $match: { 'latestInvoice.normalizedOutstanding': { $gt: 0 } } },
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
          outstandingBalance: '$latestInvoice.normalizedOutstanding',
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
            // Normalize legacy + new top-level fields
            {
              $addFields: {
                _bookingTotal: {
                  $ifNull: ['$totalAmount', { $ifNull: ['$invoiceData.bookingTotal', 0] }]
                },
                _taxAmount: {
                  $ifNull: ['$taxAmount', { $ifNull: ['$taxesTotal', { $ifNull: ['$invoiceData.taxesTotal', 0] }] }]
                },
                _paidAmount: {
                  $ifNull: ['$paidAmount', { $ifNull: ['$amountPaid', { $ifNull: ['$invoiceData.amountPaid', 0] }] }]
                },
                _outstandingAmount: {
                  $ifNull: ['$outstandingAmount', { $ifNull: ['$invoiceData.outstandingBalance', 0] }]
                },
                _extrasTotal: {
                  $ifNull: ['$extrasTotal', { $ifNull: ['$invoiceData.extrasTotal', 0] }]
                },
                _paymentMethod: {
                  $ifNull: ['$paymentMethod', '$invoiceData.paymentMethod']
                },
              },
            },
            {
              $project: {
                _id: 1,
                invoiceData: 1,
                amountPaid: 1, paidAmount: 1,
                taxesTotal: 1, taxAmount: 1,
                taxBreakdown: 1,
                totalAmount: 1,
                outstandingAmount: 1,
                extrasTotal: 1,
                paymentMethod: 1,
                notes: 1,
                paymentIds: 1,
                createdAt: 1,
                bookingTotal: '$_bookingTotal',
                normTaxAmount: '$_taxAmount',
                normPaidAmount: '$_paidAmount',
                normOutstandingAmount: '$_outstandingAmount',
                normExtrasTotal: '$_extrasTotal',
                normPaymentMethod: '$_paymentMethod',
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
