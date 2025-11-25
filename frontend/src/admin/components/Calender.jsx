import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import axios from 'axios';
import '../styles/calendar.css';
import '../styles/adminBooking.css';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchApprovedBookings();
  }, []);

  const fetchApprovedBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5000/api/bookings/calendar');
      
      // Transform bookings into FullCalendar events
      const calendarEvents = response.data.bookings.map((booking) => {
        const userName = booking.userId
          ? `${booking.userId.firstName || ''} ${booking.userId.lastName || ''}`.trim()
          : 'Unknown User';
        
        // FullCalendar's end date is exclusive, so we add 1 day to checkOut
        const checkOutDate = new Date(booking.checkOut);
        checkOutDate.setDate(checkOutDate.getDate() + 1);
        
        return {
          id: booking._id,
          title: userName,
          start: booking.checkIn,
          end: checkOutDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          extendedProps: {
            guestHouse: booking.guestHouseId?.guestHouseName || 'N/A',
            room: booking.roomId?.roomNumber || 'N/A',
            bed: booking.bedId?.bedNumber || 'N/A',
            bedType: booking.bedId?.bedType || 'N/A',
            email: booking.userId?.email || 'N/A',
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
          },
        };
      });

      setEvents(calendarEvents);
    } catch (err) {
      console.error('Error fetching approved bookings:', err);
      setError('Failed to load calendar bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo) => {
    const { extendedProps, title } = clickInfo.event;
    
    setSelectedBooking({
      guest: title,
      email: extendedProps.email,
      guestHouse: extendedProps.guestHouse,
      room: extendedProps.room,
      bed: extendedProps.bed,
      bedType: extendedProps.bedType,
      checkIn: extendedProps.checkIn,
      checkOut: extendedProps.checkOut,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-IN", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="calendar-loading">Loading calendar...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-container">
        <div className="calendar-error">{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="calendar-container">
        <div className="calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events}
            eventClick={handleEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth'
            }}
            height="auto"
            eventContent={renderEventContent}
          />
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="modal-backdrop" onClick={() => setSelectedBooking(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Booking Details</h3>

            <div className="modal-details">
              <p><strong>Guest:</strong> {selectedBooking.guest}</p>
              <p><strong>Email:</strong> {selectedBooking.email}</p>
              <p><strong>Guest House:</strong> {selectedBooking.guestHouse}</p>
              <p><strong>Room:</strong> {selectedBooking.room !== 'N/A' ? `Room ${selectedBooking.room}` : 'N/A'}</p>
              <p><strong>Bed:</strong> {
                selectedBooking.bed !== 'N/A' 
                  ? `Bed ${selectedBooking.bed} (${selectedBooking.bedType})` 
                  : 'N/A'
              }</p>
              <p><strong>Check-in:</strong> {formatDate(selectedBooking.checkIn)}</p>
              <p><strong>Check-out:</strong> {formatDate(selectedBooking.checkOut)}</p>
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function renderEventContent(eventInfo) {
  return (
    <div className="calendar-event">
      <b>{eventInfo.event.title}</b>
    </div>
  );
}