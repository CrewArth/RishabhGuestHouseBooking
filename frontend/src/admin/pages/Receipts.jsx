import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import PaymentPage from './PaymentPage';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN');
};

const Receipts = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/payments/outstanding');
      setReceipts(response.data?.receipts || []);
    } catch (err) {
      console.error('Error fetching outstanding receipts:', err);
      setError('Unable to load outstanding receipts.');
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handlePaymentSuccess = () => {
    setSelectedReceipt(null);
    fetchReceipts();
    toast.success('Outstanding payment recorded successfully.');
  };

  return (
    <div className="page-root">
      {selectedReceipt && (
        <PaymentPage
          isOpen
          bookingId={selectedReceipt.bookingId}
          initialPaymentAmount={selectedReceipt.outstandingBalance}
          onClose={() => setSelectedReceipt(null)}
          onInvoiceGenerated={handlePaymentSuccess}
        />
      )}

      <div className="page-header-row">
        <div>
          <h1 className="page-title">Receipts</h1>
          <p className="page-subtitle">Outstanding balances ready to be collected.</p>
        </div>
        <button className="btn-action view" onClick={fetchReceipts} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {loading && <p style={{ color: '#64748b' }}>Loading outstanding receipts…</p>}
      {!loading && error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {!loading && !error && (
        <div className="table-scroll">
          <table className="data-table" style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Guest House</th>
                <th>Booking Date</th>
                <th>Amount Due</th>
                <th>Last Paid</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty">No outstanding payments found.</td>
                </tr>
              ) : (
                receipts.map((receipt) => {
                  const booking = receipt.booking || {};
                  const guestName = `${booking.userId?.firstName || booking.userId?.name || ''} ${booking.userId?.lastName || ''}`.trim() || booking.fullName || '—';
                  const guestHouseName = booking.guestHouseId?.guestHouseName || '—';
                  const amountDue = Number(receipt.outstandingBalance || 0);

                  return (
                    <tr key={receipt._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{guestName}</div>
                        {booking.userId?.email && <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{booking.userId.email}</div>}
                      </td>
                      <td>{guestHouseName}</td>
                      <td>{formatDate(booking.checkIn || receipt.createdAt)}</td>
                      <td style={{ fontWeight: 700, color: '#b45309' }}>{formatCurrency(amountDue)}</td>
                      <td>{formatDate(receipt.createdAt)}</td>
                      <td><span className="badge pending">Outstanding</span></td>
                      <td>
                        <button className="btn-action view" onClick={() => setSelectedReceipt(receipt)}>
                          Receive Payment
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Receipts;
