import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import ReceiptPaymentModal from '../components/ReceiptPaymentModal';

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
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Filter state
  const [searchInput, setSearchInput] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Applied filters (committed on Search / Reset)
  const [applied, setApplied] = useState({ search: '', fromDate: '', toDate: '' });

  const fetchReceipts = async (filters = applied) => {
    setLoading(true);
    setError('');
    try {
      const body = {};
      if (filters.search)   body.search   = filters.search;
      if (filters.fromDate) body.fromDate  = filters.fromDate;
      if (filters.toDate)   body.toDate    = filters.toDate;

      const response = await api.post('/api/payments/outstanding', body);
      setReceipts(response.data?.receipts || []);
    } catch (err) {
      console.error('Error fetching outstanding receipts:', err);
      setError('Unable to load outstanding receipts.');
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    fetchReceipts({ search: '', fromDate: '', toDate: '' });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const next = { search: searchInput, fromDate, toDate };
    setApplied(next);
    fetchReceipts(next);
  };

  const handleReset = () => {
    setSearchInput('');
    setFromDate('');
    setToDate('');
    const next = { search: '', fromDate: '', toDate: '' };
    setApplied(next);
    fetchReceipts(next);
  };

  const handlePaymentSuccess = () => {
    setSelectedReceipt(null);
    fetchReceipts(applied);
    toast.success('Outstanding payment recorded successfully.');
  };

  const hasActiveFilter = applied.search || applied.fromDate || applied.toDate;

  return (
    <div className="page-root">
      {selectedReceipt && (
        <ReceiptPaymentModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Outstanding Payments</h1>
        </div>
        <button
          className="btn-action view"
          onClick={() => fetchReceipts(applied)}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Filter bar */}
      <form onSubmit={handleSearch} className="toolbar-row" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <input
          type="text"
          className="toolbar-select"
          placeholder="Search by name, phone or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ padding: '6px 12px', minWidth: 220 }}
        />

        <span className="toolbar-label">From:</span>
        <input
          type="date"
          className="toolbar-select"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{ padding: '6px 10px' }}
        />

        <span className="toolbar-label">To:</span>
        <input
          type="date"
          className="toolbar-select"
          value={toDate}
          min={fromDate || undefined}
          onChange={(e) => setToDate(e.target.value)}
          style={{ padding: '6px 10px' }}
        />

        <button type="submit" className="btn-action view" disabled={loading}>
          Search
        </button>
        {hasActiveFilter && (
          <button type="button" className="btn-action reject" onClick={handleReset}>
            Reset
          </button>
        )}
      </form>

      {/* States */}
      {loading && <p style={{ color: '#64748b' }}>Loading outstanding receipts…</p>}
      {!loading && error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {!loading && !error && (
        <div className="table-scroll">
          <table className="data-table" style={{ minWidth: 780 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Guest</th>
                <th>Check In</th>
                <th>Amount Due</th>
                <th>Last Updated</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty">
                    {hasActiveFilter
                      ? 'No outstanding payments match your filters.'
                      : 'No outstanding payments found.'}
                  </td>
                </tr>
              ) : (
                receipts.map((receipt, i) => {
                  const booking = receipt.booking || {};
                  const guestName =
                    `${booking.userId?.firstName || booking.userId?.name || ''} ${booking.userId?.lastName || ''}`.trim() ||
                    booking.fullName ||
                    '—';
                  const amountDue = Number(receipt.outstandingBalance || 0);

                  return (
                    <tr key={receipt._id}>
                      <td className="center">{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{guestName}</div>
                        {booking.userId?.email && (
                          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                            {booking.userId.email}
                          </div>
                        )}
                        {(booking.userId?.phone || booking.phone) && (
                          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                            {booking.userId?.phone || booking.phone}
                          </div>
                        )}
                      </td>
                      <td>{formatDate(booking.checkIn)}</td>
                      <td style={{ fontWeight: 700, color: '#b45309' }}>
                        {formatCurrency(amountDue)}
                      </td>
                      <td>{formatDate(receipt.createdAt)}</td>
                      <td>
                        <span className="badge pending">Outstanding</span>
                      </td>
                      <td>
                        <button
                          className="btn-action view"
                          onClick={() => setSelectedReceipt(receipt)}
                        >
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
