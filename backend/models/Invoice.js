import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },

  // ── Core invoice amounts (flattened, top-level) ──
  totalAmount:      { type: Number }, // total bill amount (bookingTotal)
  taxAmount:        { type: Number, default: 0 }, // taxesTotal
  taxBreakdown:     [{ name: String, percentage: Number, amount: Number }],
  extrasTotal:      { type: Number, default: 0 },
  paidAmount:       { type: Number, default: 0 }, // cumulative amount paid so far
  outstandingAmount:{ type: Number, default: 0 }, // remaining balance
  discountAmount:   { type: Number, default: 0 },

  // ── Optional structured line items ──
  lineItems:        [{ description: String, quantity: { type: Number, default: 1 }, unitPrice: Number, totalAmount: Number }],

  // ── Metadata ──
  paymentMethod:    { type: String },
  notes:            { type: String },

  // ── Links ──
  paymentIds:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
  createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── Legacy backward-compat: old nested invoiceData object (still supported) ──
  invoiceData:      { type: Object },
  amountPaid:       { type: Number }, // legacy field name (duplicate of paidAmount for old code)
  taxesTotal:       { type: Number, default: 0 }, // legacy field name
}, { timestamps: true });

// Pre-save hook: keep legacy fields in sync + fallback to invoiceData if top-level fields missing
invoiceSchema.pre('save', function (next) {
  const inv = this;
  const legacy = inv.invoiceData || {};

  // 1. Sync legacy fields with top-level fields
  if (inv.paidAmount != null)          inv.amountPaid = inv.paidAmount;
  else if (inv.amountPaid != null)     inv.paidAmount = inv.amountPaid;

  if (inv.taxAmount != null)           inv.taxesTotal = inv.taxAmount;
  else if (inv.taxesTotal != null)     inv.taxAmount = inv.taxesTotal;

  // 2. If top-level fields missing, fall back to legacy invoiceData object (backward compat)
  if (inv.totalAmount == null && legacy.bookingTotal != null) inv.totalAmount = legacy.bookingTotal;
  if (inv.extrasTotal == null && legacy.extrasTotal != null) inv.extrasTotal = legacy.extrasTotal;
  if (inv.paidAmount == null && legacy.amountPaid != null) {
    inv.paidAmount = legacy.amountPaid;
    inv.amountPaid = legacy.amountPaid;
  }
  if (inv.outstandingAmount == null && legacy.outstandingBalance != null) {
    inv.outstandingAmount = legacy.outstandingBalance;
  }
  if (inv.taxAmount == null && inv.taxesTotal != null) inv.taxAmount = inv.taxesTotal;
  if (inv.discountAmount == null && legacy.discount != null) inv.discountAmount = legacy.discount;
  if (inv.paymentMethod == null && legacy.paymentMethod) inv.paymentMethod = legacy.paymentMethod;

  next();
});

// Static helper: get invoice for a booking, with legacy fields normalized to top-level
invoiceSchema.statics.getForBooking = async function (bookingId) {
  const doc = await this.findOne({ bookingId }).sort({ createdAt: -1 });
  if (!doc) return null;
  // Ensure pre-save sync runs for legacy docs (convert legacy to top-level)
  if (doc.isModified && doc.isNew === false) {
    // Call pre-save logic manually to normalize
    if (doc.invoiceData) {
      if (doc.totalAmount == null && doc.invoiceData.bookingTotal != null) doc.totalAmount = doc.invoiceData.bookingTotal;
      if (doc.paidAmount == null && doc.invoiceData.amountPaid != null) doc.paidAmount = doc.invoiceData.amountPaid;
      if (doc.outstandingAmount == null && doc.invoiceData.outstandingBalance != null) doc.outstandingAmount = doc.invoiceData.outstandingBalance;
    }
  }
  return doc;
};

export default mongoose.model('Invoice', invoiceSchema);
