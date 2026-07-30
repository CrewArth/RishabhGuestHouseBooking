import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';

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
    const [bookings, invoices] = await Promise.all([
      Booking.find({ isCheckedOut: true })
        .populate('userId', 'firstName lastName email phone')
        .sort({ checkIn: -1 })
        .lean(),
      Invoice.find().sort({ createdAt: -1 }).lean(),
    ]);

    const latestInvoiceByBooking = new Map();
    for (const invoice of invoices) {
      const bookingId = String(invoice.bookingId);
      if (!latestInvoiceByBooking.has(bookingId)) {
        latestInvoiceByBooking.set(bookingId, invoice);
      }
    }

    const receipts = bookings
      .map((booking) => {
        const invoice = latestInvoiceByBooking.get(String(booking._id));
        const outstandingBalance = Number(invoice?.invoiceData?.outstandingBalance || 0);

        if (!outstandingBalance || outstandingBalance <= 0) {
          return null;
        }

        return {
          _id: booking._id,
          bookingId: booking._id,
          booking,
          outstandingBalance,
          createdAt: booking.createdAt,
        };
      })
      .filter(Boolean);

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
