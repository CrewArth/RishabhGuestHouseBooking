import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import axios from 'axios';
import '../styles/calendar.css';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    const checkInDate = new Date(extendedProps.checkIn).toLocaleDateString();
    const checkOutDate = new Date(extendedProps.checkOut).toLocaleDateString();
    
    alert(
      `Booking Details:\n\n` +
      `Guest: ${title}\n` +
      `Email: ${extendedProps.email}\n` +
      `Guest House: ${extendedProps.guestHouse}\n` +
      `Room: ${extendedProps.room}\n` +
      `Bed: ${extendedProps.bed} (${extendedProps.bedType})\n` +
      `Check-in: ${checkInDate}\n` +
      `Check-out: ${checkOutDate}`
    );
    
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
  );
}

function renderEventContent(eventInfo) {
  return (
    <div className="calendar-event">
      <b>{eventInfo.event.title}</b>
    </div>
  );
}