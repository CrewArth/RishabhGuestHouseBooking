import { useEffect, useState } from 'react';
import api from '../../utils/api';
import '../styles/todayBookings.css';

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [appliedFilter, setAppliedFilter] = useState({ startDate: today, endDate: today });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/api/bookings', { params: appliedFilter });
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
  }, [appliedFilter]);

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

  return (
    <section className="today-bookings" aria-labelledby="today-bookings-title">
      <div className="today-bookings-header">
        <div>
          <h2 id="today-bookings-title">Today&apos;s Bookings</h2>
          <p>Bookings submitted within the selected date range.</p>
        </div>

        <div className="today-bookings-filters">
          <label>
            From
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={toDate} min={fromDate} onChange={(event) => setToDate(event.target.value)} />
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
