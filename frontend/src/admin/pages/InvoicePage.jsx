import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const currency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN');
};

const InvoicePage = ({ isModal = false, onClose, invoice: invoiceProp }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const invoice = invoiceProp || location.state?.invoice || JSON.parse(localStorage.getItem('latestInvoice') || 'null');

  const handlePrint = () => {
    window.print();
  };

  if (!invoice) {
    return (
      <div style={{ padding: '24px' }}>
        <button onClick={() => (isModal ? onClose?.() : navigate(-1))} style={buttonStyle}>Back</button>
        <h2>No invoice found</h2>
      </div>
    );
  }

  const content = (
    <div style={{ padding: '16px', maxWidth: '640px', margin: '0 auto', background: '#fff', color: '#1f2937' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: '160px' }}>
          <h1 style={{ margin: 0, fontSize: '1.35rem', letterSpacing: '0.03em' }}></h1>
          <p style={{ margin: '10px 0 0', lineHeight: 1.4, color: '#475569' }}>
            <br />
            <br />
           
          </p>
        </div>
        <div style={{ minWidth: '140px', textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontSize: '1.35rem', letterSpacing: '0.05em', color: '#374151' }}>INVOICE</h2>
          <div style={{ marginTop: '12px', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}>
              <div style={{ padding: '10px 12px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>INVOICE #</div>
              <div style={{ padding: '10px 12px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>DATE</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ padding: '10px 12px', fontSize: '0.95rem' }}>{invoice.id}</div>
              <div style={{ padding: '10px 12px', fontSize: '0.95rem' }}>{formatDate(invoice.createdAt)}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', background: '#f8fafc', padding: '14px' }}>
          <div style={{ marginBottom: '10px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Bill To</div>
          <div style={{ fontSize: '0.95rem', lineHeight: 1.8 }}>
            <div>{invoice.guestName}</div>
            <div>{invoice.bookingId ? `Booking ID: ${invoice.bookingId}` : ''}</div>
          </div>
        </div>
        <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', background: '#f8fafc', padding: '18px' }}>
          <div style={{ marginBottom: '10px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Payment Details</div>
          <div style={{ fontSize: '0.95rem', lineHeight: 1.8 }}>
            <div>Method: {invoice.paymentMethod || '—'}</div>
            <div>Paid On: {formatDate(invoice.createdAt)}</div>
          </div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <thead>
          <tr>
            <th style={{ ...tableHeaderStyle, textAlign: 'left', background: '#e5e7eb', borderBottom: '2px solid #9ca3af' }}>Description</th>
            <th style={{ ...tableHeaderStyle, textAlign: 'right', background: '#e5e7eb', borderBottom: '2px solid #9ca3af' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...tableCellStyle, borderBottom: '1px solid #e5e7eb' }}>Booking Charges</td>
            <td style={{ ...tableCellStyle, borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{currency(invoice.bookingTotal - (invoice.extrasTotal || 0))}</td>
          </tr>
          <tr>
            <td style={{ ...tableCellStyle, borderBottom: '1px solid #e5e7eb' }}>Extras / Add-ons</td>
            <td style={{ ...tableCellStyle, borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{currency(invoice.extrasTotal || 0)}</td>
          </tr>
          <tr>
            <td style={{ ...tableCellStyle, borderBottom: '1px solid #e5e7eb' }}>Amount Paid</td>
            <td style={{ ...tableCellStyle, borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{currency(invoice.amountPaid || 0)}</td>
          </tr>
          <tr>
            <td style={{ ...tableCellStyle, borderBottom: '1px solid #e5e7eb' }}>Outstanding Balance</td>
            <td style={{ ...tableCellStyle, borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{currency(invoice.outstandingBalance || 0)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #d1d5db', paddingTop: '12px', marginBottom: '12px' }}>
        <div style={{ fontSize: '0.9rem', color: '#475569' }}>
          Thank you for your business!
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>Total</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '6px' }}>{currency(invoice.bookingTotal || 0)}</div>
        </div>
      </div>

      <div style={{ fontSize: '0.82rem', color: '#6b7280', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
        If you have any questions about this invoice, please contact GuestHouse Booking at (000) 000-0000 or support@guesthousebooking.example.
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={(event) => event.stopPropagation()}>{content}</div>
      </div>
    );
  }

  return (
    <>
      <style>{`@media print { button { display: none !important; } body { background: #fff; } }`}</style>
      {content}
    </>
  );
};

const buttonStyle = { padding: '6px 10px', border: 'none', borderRadius: '8px', background: '#e2e8f0', color: '#0f172a', cursor: 'pointer' };
const primaryButtonStyle = { padding: '6px 10px', border: 'none', borderRadius: '8px', background: '#2563eb', color: '#fff', cursor: 'pointer' };
const invoiceCardStyle = { background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)' };
const infoBoxStyle = { border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px', background: '#f8fafc' };
const tableHeaderStyle = { padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' };
const tableCellStyle = { padding: '8px 10px', borderBottom: '1px solid #f1f5f9' };
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', zIndex: 2200 };
const modalStyle = { width: 'min(680px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#f8fafc', borderRadius: '18px', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.18)' };

export default InvoicePage;