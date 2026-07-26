import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import editIcon from '../../assets/edit.svg';
import '../styles/todayBookings.css';
const getLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getOneWeekAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return getLocalDate(date);
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export default function TodayBookings() {
  const today = getLocalDate();
  const oneWeekAgo = getOneWeekAgo();
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState(oneWeekAgo);
  const [toDate, setToDate] = useState(today);
  const [appliedFilter, setAppliedFilter] = useState({ startDate: oneWeekAgo, endDate: today });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cancel confirmation modal state
  const [cancelTarget, setCancelTarget] = useState(null); // booking to cancel
  const [cancelling, setCancelling] = useState(false);

  // If the admin has an assigned guest house, scope all queries to it
  const assignedGuestHouse = useSelector((state) => state.auth.user?.assignedGuestHouseId);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError('');
        const params = { ...appliedFilter };
        if (assignedGuestHouse) {
          // assignedGuestHouse could be an object or just the guestHouseId string
          params.guestHouseId = assignedGuestHouse.guestHouseId || assignedGuestHouse;
        }
        const response = await api.get('/api/bookings', { params });
        setBookings(response.data.bookings || []);
      } catch (requestError) {
        console.error('Error fetching dashboard bookings:', requestError);
        setError('Unable to load bookings for this date range.');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [appliedFilter, assignedGuestHouse]);

  const applyFilter = () => {
    if (!fromDate || !toDate || fromDate > toDate) {
      setError('Select a valid date range.');
      return;
    }

    setAppliedFilter({ startDate: fromDate, endDate: toDate });
  };

  const showToday = () => {
    setFromDate(today);
    setToDate(today);
    setAppliedFilter({ startDate: today, endDate: today });
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      setCancelling(true);
      await api.patch(`/api/bookings/${cancelTarget._id}/cancel`);
      setBookings((prev) =>
        prev.map((b) => b._id === cancelTarget._id ? { ...b, status: 'cancelled' } : b)
      );
      setCancelTarget(null);
    } catch (err) {
      console.error('Error cancelling booking:', err);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <section className="today-bookings" aria-labelledby="today-bookings-title">
      {/* ── Cancel confirmation modal ── */}
      {cancelTarget && (
        <div className="tb-modal-backdrop" onClick={() => setCancelTarget(null)}>
          <div className="tb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tb-modal-icon">🗑️</div>
            <h3 className="tb-modal-title">Cancel Booking?</h3>
            <p className="tb-modal-body">
              Are you sure you want to cancel the booking for&nbsp;
              <strong>
                {`${cancelTarget.userId?.firstName || ''} ${cancelTarget.userId?.lastName || ''}`.trim() || cancelTarget.fullName || 'this guest'}
              </strong>?
              <br />This action cannot be undone.
            </p>
            <div className="tb-modal-actions">
              <button
                className="tb-modal-btn tb-modal-btn--cancel"
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
              >
                No, Keep It
              </button>
              <button
                className="tb-modal-btn tb-modal-btn--confirm"
                onClick={handleCancelConfirm}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="today-bookings-header">
        <div>
          <h2 id="today-bookings-title" style={{fontWeight: "bold", marginBottom: "30px"}}>
            Today&apos;s Bookings <span style={{ color: '#6c757d', fontSize: '0.8em', fontWeight: 'normal', marginLeft: '8px' }}>({formatDate(today)})</span>
          </h2>
        </div>

        <div className="today-bookings-filters">
          <label>
            From
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </label>
          <button type="button" onClick={applyFilter}>Filter</button>
          <button type="button" className="today-bookings-secondary" onClick={showToday}>Today</button>
        </div>
      </div>

      {loading && <p className="today-bookings-message">Loading bookings…</p>}
      {!loading && error && <p className="today-bookings-error">{error}</p>}

      {!loading && !error && (
        <div className="today-bookings-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Guest House</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Room / Bed</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="today-bookings-empty">No bookings found for this date range.</td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>{`${booking.userId?.firstName || ''} ${booking.userId?.lastName || ''}`.trim() || booking.fullName || '—'}</td>
                    <td>{booking.guestHouseId?.guestHouseName || '—'}</td>
                    <td>{formatDate(booking.checkIn)}</td>
                    <td>{formatDate(booking.checkOut)}</td>
                    <td>
                      {booking.roomId?.roomNumber ? `Room ${booking.roomId.roomNumber}` : '—'}
                      {booking.bedId?.bedNumber ? ` / Bed ${booking.bedId.bedNumber}` : ''}
                    </td>
                    <td><span className={`today-bookings-status ${booking.status}`}>{booking.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          className="btn-action edit"
                          onClick={() => navigate('/admin/book-room', { state: { bookingId: booking._id } })}
                          title="Edit booking"
                          style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: '4px' }}
                        >
                          <img src={editIcon} alt="Edit" style={{ width: 16, height: 16 }} />
                        </button>

                        {booking.status !== 'cancelled' && (
                          <button
                            className="tb-cancel-btn"
                            onClick={() => setCancelTarget(booking)}
                            title="Cancel booking"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
