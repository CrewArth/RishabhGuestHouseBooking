import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import '../styles/receiptPaymentModal.css';

/* ── helpers ─────────────────────────────────────────────── */
const fmt = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const fmtDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const PAYMENT_METHODS = ['Cash', 'Debit Card', 'Credit Card', 'UPI', 'Bank Transfer', 'Other'];

const METHOD_ICONS = {
  Cash: '💵',
  'Debit Card': '💳',
  'Credit Card': '💳',
  UPI: '📱',
  'Bank Transfer': '🏦',
  Other: '🔖',
};

/* ── component ───────────────────────────────────────────── */
export default function ReceiptPaymentModal({ receipt, onClose, onSuccess }) {
  const { bookingId, outstandingBalance, booking: receiptBooking } = receipt || {};

  const [booking, setBooking] = useState(receiptBooking || null);
  const [invoice, setInvoice] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(!receiptBooking);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentAmount, setPaymentAmount] = useState(String(outstandingBalance || ''));
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'payment'

  /* fetch full booking if not already provided */
  useEffect(() => {
    if (!bookingId) return;

    const load = async () => {
      try {
        setLoadingBooking(true);
        const [bookingRes, invoiceRes] = await Promise.allSettled([
          api.get(`/api/bookings/${bookingId}`),
          api.get(`/api/payments/booking/${bookingId}/invoice`),
        ]);

        if (bookingRes.status === 'fulfilled') {
          setBooking(bookingRes.value.data?.booking || null);
        }
        if (invoiceRes.status === 'fulfilled') {
          const inv = invoiceRes.value.data?.invoice || invoiceRes.value.data?.invoiceDoc?.invoiceData;
          setInvoice(inv || null);
        }
      } catch (err) {
        console.error('ReceiptPaymentModal load error:', err);
      } finally {
        setLoadingBooking(false);
      }
    };

    load();
  }, [bookingId]);

  /* derived values */
  const nights = useMemo(() => {
    if (!booking?.checkIn || !booking?.checkOut) return 0;
    const diff = new Date(booking.checkOut) - new Date(booking.checkIn);
    return diff > 0 ? Math.max(1, Math.ceil(diff / 86400000)) : 0;
  }, [booking]);

  const guestName = booking
    ? `${booking.userId?.firstName || booking.fullName || ''}${booking.userId?.lastName ? ' ' + booking.userId.lastName : ''}`.trim() || '—'
    : '—';

  const totalBilled   = Number(invoice?.bookingTotal   || outstandingBalance || 0);
  const totalPaid     = Number(invoice?.amountPaid     || 0);
  const outstanding   = Number(outstandingBalance      || 0);
  const payAmt        = Number(paymentAmount)          || 0;
  const afterPayment  = Math.max(0, outstanding - payAmt);
  const isValid       = payAmt > 0 && payAmt <= outstanding;

  /* submit */
  const handleSubmit = async () => {
    if (!isValid) {
      toast.error('Enter a valid amount (1 – outstanding balance).');
      return;
    }

    try {
      setSubmitting(true);

      const updatedInvoice = {
        ...(invoice || {}),
        bookingId,
        amountPaid: totalPaid + payAmt,
        outstandingBalance: afterPayment,
        paymentMethod,
        note,
        createdAt: new Date().toISOString(),
        bookingDetails: booking,
      };

      await api.post('/api/payments', {
        bookingId,
        amountPaid: payAmt,
        paymentMethod,
        taxesTotal: invoice?.taxesTotal || 0,
        taxBreakdown: invoice?.taxBreakdown || [],
        invoiceId: invoice?.id || null,
        invoice: updatedInvoice,
        note,
      });

      toast.success('Payment recorded successfully.');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('ReceiptPaymentModal submit error:', err);
      toast.error(err.response?.data?.message || 'Unable to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── rooms label ──────────────────────────────────────── */
  const roomsLabel = useMemo(() => {
    if (!booking) return '—';
    const rooms = booking.roomIds?.length ? booking.roomIds : booking.roomId ? [booking.roomId] : [];
    return rooms.map((r) => (r?.roomNumber ? `Room ${r.roomNumber}` : '')).filter(Boolean).join(', ') || '—';
  }, [booking]);

  return (
    <div className="rpm-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Record Payment">
      <div className="rpm-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="rpm-header">
          <div className="rpm-header-left">
            <div className="rpm-header-icon">₹</div>
            <div>
              <h2 className="rpm-title">Receive Outstanding Payment</h2>
              <p className="rpm-subtitle">Record a payment against the outstanding balance</p>
            </div>
          </div>
          <button className="rpm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── Outstanding Banner ── */}
        <div className="rpm-banner">
          <div className="rpm-banner-item">
            <span>Total Billed</span>
            <strong>{fmt(totalBilled)}</strong>
          </div>
          <div className="rpm-banner-divider" />
          <div className="rpm-banner-item">
            <span>Already Paid</span>
            <strong className="rpm-banner-paid">{fmt(totalPaid)}</strong>
          </div>
          <div className="rpm-banner-divider" />
          <div className="rpm-banner-item rpm-banner-outstanding">
            <span>Outstanding</span>
            <strong>{fmt(outstanding)}</strong>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="rpm-tabs">
          <button
            className={`rpm-tab${activeTab === 'details' ? ' rpm-tab--active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Booking Details
          </button>
          <button
            className={`rpm-tab${activeTab === 'payment' ? ' rpm-tab--active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            Record Payment
          </button>
        </div>

        {/* ── Body ── */}
        <div className="rpm-body">

          {/* ── TAB: Booking Details ── */}
          {activeTab === 'details' && (
            <div className="rpm-details">
              {loadingBooking ? (
                <p className="rpm-loading">Loading booking details…</p>
              ) : !booking ? (
                <p className="rpm-error">Could not load booking details.</p>
              ) : (
                <>
                  {/* Guest info */}
                  <div className="rpm-section">
                    <h3 className="rpm-section-title">Guest Information</h3>
                    <div className="rpm-grid">
                      <div className="rpm-field">
                        <span>Guest Name</span>
                        <strong>{guestName}</strong>
                      </div>
                      <div className="rpm-field">
                        <span>Email</span>
                        <strong>{booking.userId?.email || booking.email || '—'}</strong>
                      </div>
                      <div className="rpm-field">
                        <span>Phone</span>
                        <strong>{booking.phone || booking.userId?.phone || '—'}</strong>
                      </div>
                      <div className="rpm-field">
                        <span>Nationality</span>
                        <strong>{booking.nationality || '—'}</strong>
                      </div>
                      {booking.identityType && (
                        <div className="rpm-field">
                          <span>ID Type</span>
                          <strong>{booking.identityType}</strong>
                        </div>
                      )}
                      {booking.identityNumber && (
                        <div className="rpm-field">
                          <span>ID Number</span>
                          <strong>{booking.identityNumber}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stay info */}
                  <div className="rpm-section">
                    <h3 className="rpm-section-title">Stay Details</h3>
                    <div className="rpm-grid">
                      <div className="rpm-field">
                        <span>Guest House</span>
                        <strong>{booking.guestHouseId?.guestHouseName || booking.guestHouseId || '—'}</strong>
                      </div>
                      <div className="rpm-field">
                        <span>Room(s)</span>
                        <strong>{roomsLabel}</strong>
                      </div>
                      {booking.bedId?.bedNumber && (
                        <div className="rpm-field">
                          <span>Bed</span>
                          <strong>Bed {booking.bedId.bedNumber} · {booking.bedId.bedType}</strong>
                        </div>
                      )}
                      <div className="rpm-field">
                        <span>Check In</span>
                        <strong>{fmtDate(booking.checkIn)}</strong>
                      </div>
                      <div className="rpm-field">
                        <span>Check Out</span>
                        <strong>{fmtDate(booking.checkOut)}</strong>
                      </div>
                      <div className="rpm-field">
                        <span>Duration</span>
                        <strong>{nights} night{nights !== 1 ? 's' : ''}</strong>
                      </div>
                      <div className="rpm-field">
                        <span>Status</span>
                        <strong>
                          <span className={`rpm-status rpm-status--${booking.status}`}>{booking.status}</span>
                        </strong>
                      </div>
                      <div className="rpm-field">
                        <span>Guests</span>
                        <strong>{(booking.familyMembers?.length || 0) + 1} person(s)</strong>
                      </div>
                    </div>
                  </div>

                  {/* Billing summary */}
                  {invoice && (
                    <div className="rpm-section">
                      <h3 className="rpm-section-title">Billing Summary</h3>
                      <div className="rpm-bill-rows">
                        {invoice.bookingTotal != null && (
                          <div className="rpm-bill-row">
                            <span>Room Charges</span>
                            <span>{fmt(invoice.bookingTotal - (invoice.taxesTotal || 0) - (invoice.extrasTotal || 0))}</span>
                          </div>
                        )}
                        {invoice.extrasTotal > 0 && (
                          <div className="rpm-bill-row">
                            <span>Extras</span>
                            <span>{fmt(invoice.extrasTotal)}</span>
                          </div>
                        )}
                        {invoice.taxBreakdown?.length > 0 && invoice.taxBreakdown.map((t, i) => (
                          <div key={i} className="rpm-bill-row rpm-bill-row--tax">
                            <span>{t.name} ({t.percentage}%)</span>
                            <span>{fmt(t.amount)}</span>
                          </div>
                        ))}
                        {invoice.taxesTotal > 0 && (
                          <div className="rpm-bill-row">
                            <span>Total Taxes</span>
                            <span>{fmt(invoice.taxesTotal)}</span>
                          </div>
                        )}
                        <div className="rpm-bill-row rpm-bill-row--total">
                          <span>Grand Total</span>
                          <span>{fmt(totalBilled)}</span>
                        </div>
                        <div className="rpm-bill-row rpm-bill-row--paid">
                          <span>Amount Paid</span>
                          <span>− {fmt(totalPaid)}</span>
                        </div>
                        <div className="rpm-bill-row rpm-bill-row--outstanding">
                          <span>Outstanding Balance</span>
                          <span>{fmt(outstanding)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Family members */}
                  {booking.familyMembers?.length > 0 && (
                    <div className="rpm-section">
                      <h3 className="rpm-section-title">Family Members ({booking.familyMembers.length})</h3>
                      <div className="rpm-family-list">
                        {booking.familyMembers.map((m, i) => (
                          <div key={i} className="rpm-family-item">
                            <strong>{m.name}</strong>
                            <span>{m.relation}{m.age != null ? ` · Age ${m.age}` : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {booking.specialRequests && (
                    <div className="rpm-section">
                      <h3 className="rpm-section-title">Special Requests</h3>
                      <p className="rpm-note">{booking.specialRequests}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TAB: Record Payment ── */}
          {activeTab === 'payment' && (
            <div className="rpm-payment">
              {/* Amount summary */}
              <div className="rpm-pay-summary">
                <div className="rpm-pay-sum-item">
                  <span>Outstanding</span>
                  <strong className="rpm-pay-outstanding">{fmt(outstanding)}</strong>
                </div>
                <div className="rpm-pay-arrow">→</div>
                <div className="rpm-pay-sum-item">
                  <span>You're paying</span>
                  <strong className={`rpm-pay-amount${!isValid && paymentAmount ? ' rpm-pay-amount--error' : ''}`}>
                    {payAmt > 0 ? fmt(payAmt) : '—'}
                  </strong>
                </div>
                <div className="rpm-pay-arrow">→</div>
                <div className="rpm-pay-sum-item">
                  <span>Remaining after</span>
                  <strong className={afterPayment === 0 && payAmt > 0 ? 'rpm-pay-cleared' : ''}>
                    {payAmt > 0 && isValid ? fmt(afterPayment) : '—'}
                  </strong>
                </div>
              </div>

              {/* Payment method */}
              <div className="rpm-section">
                <h3 className="rpm-section-title">Payment Method</h3>
                <div className="rpm-method-grid">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      className={`rpm-method-btn${paymentMethod === method ? ' rpm-method-btn--active' : ''}`}
                      onClick={() => setPaymentMethod(method)}
                    >
                      <span className="rpm-method-icon">{METHOD_ICONS[method]}</span>
                      <span>{method}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div className="rpm-section">
                <h3 className="rpm-section-title">Amount to Collect</h3>
                <div className="rpm-amount-wrap">
                  <span className="rpm-amount-prefix">₹</span>
                  <input
                    type="number"
                    className="rpm-amount-input"
                    min="1"
                    max={outstanding}
                    step="1"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={`Max ${outstanding}`}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="rpm-amount-full"
                    onClick={() => setPaymentAmount(String(outstanding))}
                  >
                    Full Amount
                  </button>
                </div>
                {paymentAmount && !isValid && (
                  <p className="rpm-input-error">
                    Amount must be between ₹1 and {fmt(outstanding)}.
                  </p>
                )}
                {isValid && afterPayment === 0 && (
                  <p className="rpm-input-success">✓ This will fully clear the outstanding balance.</p>
                )}
                {isValid && afterPayment > 0 && (
                  <p className="rpm-input-info">
                    A balance of {fmt(afterPayment)} will remain outstanding after this payment.
                  </p>
                )}
              </div>

              {/* Note */}
              <div className="rpm-section">
                <h3 className="rpm-section-title">Internal Note <span className="rpm-optional">(optional)</span></h3>
                <textarea
                  className="rpm-note-input"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Partial payment received at front desk"
                />
              </div>

              {/* Confirm row */}
              <div className="rpm-confirm-row">
                <div className="rpm-confirm-info">
                  <div className="rpm-confirm-method">
                    <span className="rpm-method-icon">{METHOD_ICONS[paymentMethod]}</span>
                    {paymentMethod}
                  </div>
                  {isValid && (
                    <div className="rpm-confirm-amount">{fmt(payAmt)}</div>
                  )}
                </div>
                <button
                  type="button"
                  className="rpm-submit-btn"
                  onClick={handleSubmit}
                  disabled={!isValid || submitting}
                >
                  {submitting ? 'Recording…' : 'Record Payment'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer navigation ── */}
        <div className="rpm-footer">
          <button className="rpm-footer-btn rpm-footer-btn--secondary" onClick={onClose}>
            Cancel
          </button>
          {activeTab === 'details' ? (
            <button className="rpm-footer-btn rpm-footer-btn--primary" onClick={() => setActiveTab('payment')}>
              Proceed to Payment →
            </button>
          ) : (
            <button
              className="rpm-footer-btn rpm-footer-btn--primary"
              onClick={handleSubmit}
              disabled={!isValid || submitting}
            >
              {submitting ? 'Recording…' : 'Record Payment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
