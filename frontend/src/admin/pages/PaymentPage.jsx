import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const steps = ['Booking Summary', 'Extras / Charges', 'Payment'];
const paymentMethods = ['Cash', 'Debit Card', 'Credit Card', 'UPI', 'Bank Transfer', 'Other'];

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN');
};

const currency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

const compressLogo = (dataUrl, maxSize = 120) =>
  new Promise((resolve) => {
    if (!dataUrl) return resolve(null);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png', 0.85));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });

const PaymentPage = ({ isOpen = false, onClose, bookingId: bookingIdProp, onInvoiceGenerated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingId = bookingIdProp || location.state?.bookingId;

  const [activeStep, setActiveStep] = useState(1);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [extras, setExtras] = useState([{ name: '', quantity: '1', unitPrice: '0', total: 0 }]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const logoUrl = useSelector((state) => state.siteSettings.logoUrl);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setError('No booking was selected for checkout.');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get(`/api/bookings/${bookingId}`);
        setBooking(response.data?.booking || null);
      } catch (err) {
        console.error(err);
        setError('Unable to load booking details for payment.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const nights = useMemo(() => {
    if (!booking?.checkIn || !booking?.checkOut) return 0;
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    const diff = end.getTime() - start.getTime();
    return diff > 0 ? Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24))) : 0;
  }, [booking]);

  const nightlyRate = 2000;
  const roomCharges = nights * nightlyRate;
  const taxes = 0;
  const subtotal = roomCharges + taxes;

  const extrasTotal = useMemo(() => extras.reduce((sum, item) => sum + Number(item.total || 0), 0), [extras]);
  const bookingTotal = subtotal + extrasTotal;
  const paymentAmountValue = Number(paymentAmount || 0);
  const remainingBalance = Math.max(0, bookingTotal - paymentAmountValue);
  const isPaymentValid = paymentAmountValue > 0 && paymentAmountValue <= bookingTotal;

  const updateExtra = (index, field, value) => {
    const nextExtras = [...extras];
    nextExtras[index][field] = value;

    const quantity = Number(nextExtras[index].quantity || 0);
    const unitPrice = Number(nextExtras[index].unitPrice || 0);
    nextExtras[index].total = quantity * unitPrice;

    setExtras(nextExtras);
  };

  const addExtra = () => {
    setExtras([...extras, { name: '', quantity: '1', unitPrice: '0', total: 0 }]);
  };

  const removeExtra = (index) => {
    if (extras.length === 1) {
      setExtras([{ name: '', quantity: '1', unitPrice: '0', total: 0 }]);
      return;
    }

    setExtras(extras.filter((_, itemIndex) => itemIndex !== index));
  };

  const submitPayment = async () => {
    if (!isPaymentValid) {
      toast.error('Please enter a valid payment amount that does not exceed the outstanding balance.');
      return;
    }

    try {
      setSubmitting(true);
      const invoice = {
        id: `INV-${Date.now()}`,
        bookingId,
        guestName: booking?.userId?.firstName || booking?.fullName || 'Guest',
        bookingDate: booking?.checkIn || new Date().toISOString(),
        amountPaid: paymentAmountValue,
        extrasTotal,
        bookingTotal,
        outstandingBalance: remainingBalance,
        paymentMethod,
        createdAt: new Date().toISOString(),
        bookingDetails: booking,
      };

      const compressedLogo = await compressLogo(logoUrl);
      const response = await api.post(
        '/api/reports/invoice/generate',
        { invoice, logoUrl: compressedLogo },
        { responseType: 'blob' }
      );

      if (response.data?.type === 'application/json') {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.error || 'Could not generate invoice PDF.');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Invoice PDF generated and downloaded successfully.');
      if (onInvoiceGenerated) {
        onInvoiceGenerated(invoice);
      }
    } catch (err) {
      console.error(err);

      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          toast.error(json.error || 'Could not generate invoice PDF.');
        } catch {
          toast.error('Could not generate invoice PDF.');
        }
      } else {
        toast.error(err.message || 'Could not complete payment.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = () => {
    if (activeStep < steps.length) {
      setActiveStep((step) => Math.min(steps.length, step + 1));
      return;
    }

    submitPayment();
  };

  const renderStepContent = () => {
    if (loading) {
      return <p style={{ color: '#64748b' }}>Loading booking details…</p>;
    }

    if (error || !booking) {
      return <p style={{ color: '#dc2626' }}>{error || 'Booking details could not be loaded.'}</p>;
    }

    if (activeStep === 1) {
      return (
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {[
              { label: 'Guest', value: `${booking.userId?.firstName || booking.fullName || '—'} ${booking.userId?.lastName || ''}`.trim() || '—' },
              { label: 'Email', value: booking.userId?.email || booking.email || '—' },
              { label: 'Phone', value: booking.phone || '—' },
              { label: 'Guest House', value: booking.guestHouseId?.guestHouseName || booking.guestHouseId || '—' },
              { label: 'Room', value: booking.roomId?.roomNumber ? `Room ${booking.roomId.roomNumber}` : '—' },
              { label: 'Bed', value: booking.bedId?.bedNumber ? `Bed ${booking.bedId.bedNumber}` : '—' },
              { label: 'Check In', value: formatDate(booking.checkIn) },
              { label: 'Check Out', value: formatDate(booking.checkOut) },
              { label: 'Guests', value: (booking.familyMembers?.length || 0) + 1 },
              { label: 'Nights', value: nights },
              { label: 'Room Charges', value: currency(roomCharges) },
              { label: 'Taxes', value: currency(taxes) },
              { label: 'Booking Subtotal', value: currency(subtotal) },
            ].map((item) => (
              <div key={item.label} style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ marginBottom: '8px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>{item.label}</div>
                <div style={{ fontSize: '0.95rem', color: '#0f172a' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeStep === 2) {
      return (
        <div style={{ display: 'grid', gap: '12px' }}>
          {extras.map((item, index) => (
            <div key={index} style={extraCardStyle}>
              <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1.4fr 0.7fr 0.9fr auto', alignItems: 'end' }}>
                <label style={{ display: 'grid', gap: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Extra / Activity</span>
                  <input value={item.name} onChange={(event) => updateExtra(index, 'name', event.target.value)} placeholder="Extra Bed" style={inputStyle} />
                </label>
                <label style={{ display: 'grid', gap: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Qty</span>
                  <input type="number" min="1" value={item.quantity} onChange={(event) => updateExtra(index, 'quantity', event.target.value)} style={inputStyle} />
                </label>
                <label style={{ display: 'grid', gap: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Unit Price</span>
                  <input type="number" min="0" value={item.unitPrice} onChange={(event) => updateExtra(index, 'unitPrice', event.target.value)} style={inputStyle} />
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total</span>
                  <strong>{currency(item.total || 0)}</strong>
                  <button type="button" onClick={() => removeExtra(index)} style={removeButtonStyle}>Remove</button>
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addExtra} style={secondaryButtonStyle}>+ Add Extra Item</button>
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: '22px' }}>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div style={{ ...summaryCardStyle, borderLeft: '4px solid #2563eb' }}>
            <span style={{ color: '#64748b' }}>Total Due</span>
            <strong style={{ fontSize: '1.6rem' }}>{currency(bookingTotal)}</strong>
          </div>
          <div style={{ ...summaryCardStyle, borderLeft: '4px solid #dc2626' }}>
            <span style={{ color: '#64748b' }}>Remaining After Payment</span>
            <strong style={{ fontSize: '1.6rem' }}>{currency(remainingBalance)}</strong>
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '12px' }}>Select Payment Method</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            {paymentMethods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                style={{
                  ...methodButtonStyle,
                  minHeight: '72px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: paymentMethod === method ? '#2563eb' : '#f8fafc',
                  color: paymentMethod === method ? '#fff' : '#0f172a',
                  borderColor: paymentMethod === method ? '#2563eb' : '#dbe3ee',
                }}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontWeight: 600 }}>Payment Amount</span>
          <input type="number" min="0" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} style={inputStyle} />
          {!isPaymentValid && paymentAmount && (
            <small style={{ color: '#dc2626' }}>Payment amount cannot exceed the outstanding balance.</small>
          )}
        </label>
      </div>
    );
  };

  const content = (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px' }}>Checkout / Payment</h2>
        </div>
        {isOpen && onClose ? (
          <button type="button" onClick={onClose} style={backButtonStyle}>✕ Close</button>
        ) : null}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === activeStep;
          const isDone = stepNumber < activeStep;
          return (
            <div key={label} style={{ ...stepPillStyle, background: isActive ? '#2563eb' : isDone ? '#dbeafe' : '#f8fafc', color: isActive || isDone ? '#fff' : '#334155' }}>
              <strong>{stepNumber}</strong> {label}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 8px 28px rgba(15, 23, 42, 0.08)' }}>
          {renderStepContent()}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setActiveStep((step) => Math.max(1, step - 1))} disabled={activeStep === 1} style={navButtonStyle}>
            Previous
          </button>
          <button type="button" onClick={handleAction} disabled={submitting || (activeStep === steps.length && !isPaymentValid)} style={primaryButtonStyle}>
            {activeStep < steps.length ? 'Next' : submitting ? 'Processing…' : 'Submit Payment'}
          </button>
        </div>
      </div>
    </div>
  );

  if (isOpen) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  return content;
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.62)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  zIndex: 2000,
};

const modalStyle = {
  width: 'min(1100px, 100%)',
  maxHeight: '92vh',
  overflowY: 'auto',
  background: '#f8fafc',
  borderRadius: '18px',
  boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
};

const tableHeaderStyle = { padding: '10px 12px', textAlign: 'left', background: '#f8fafc', width: '180px' };
const tableCellStyle = { padding: '10px 12px' };
const inputStyle = { padding: '8px 10px', border: '1px solid #dbe3ee', borderRadius: '8px', fontSize: '0.95rem' };
const primaryButtonStyle = { padding: '10px 16px', border: 'none', borderRadius: '8px', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 };
const navButtonStyle = { padding: '10px 16px', border: '1px solid #dbe3ee', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: 600 };
const backButtonStyle = { padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#e2e8f0', color: '#0f172a', cursor: 'pointer' };
const secondaryButtonStyle = { padding: '10px 14px', border: '1px dashed #2563eb', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontWeight: 600, width: 'fit-content' };
const extraCardStyle = { border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', background: '#f8fafc' };
const removeButtonStyle = { padding: '6px 8px', border: 'none', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer', fontSize: '0.8rem' };
const methodButtonStyle = { padding: '10px', borderRadius: '10px', border: '1px solid #dbe3ee', cursor: 'pointer', fontWeight: 600 };
const summaryCardStyle = { padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', gap: '4px' };
const stepPillStyle = { padding: '8px 12px', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 600 };

export default PaymentPage;
