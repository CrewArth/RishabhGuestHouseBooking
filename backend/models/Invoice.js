import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  invoiceId: { type: mongoose.Schema.Types.ObjectId },
  invoiceData: { type: Object },
  amountPaid: { type: Number, required: true },
  taxesTotal: { type: Number, default: 0 },
  taxBreakdown: [{ name: String, percentage: Number, amount: Number }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Invoice', invoiceSchema);
