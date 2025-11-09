import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/bookingform.css';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import axios from 'axios';

const BookingForm = () => {
  const location = useLocation();
  const selectedGuestHouse = location.state?.guestHouse;

  // Fetch user from localStorage
  const storedUser = JSON.parse(localStorage.getItem('user')) || null;

  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [bedsLoading, setBedsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState(null);
  const [bedsError, setBedsError] = useState(null);

  const [formData, setFormData] = useState({
    checkInDate: '',
    checkOutDate: '',
    guestHouse: selectedGuestHouse || '',
    room: '',
    bed: '',
    fullName: storedUser ? `${storedUser.firstName} ${storedUser.lastName}` : '',
    email: storedUser?.email || '',
    phone: storedUser?.phone || '',
    address: storedUser?.address || '',
    specialRequests: ''
  });

    useEffect(() => {
    if (storedUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: `${storedUser.firstName} ${storedUser.lastName}`,
        email: storedUser.email,
        phone: storedUser.phone,
        address: storedUser.address || '',
      }));
    }
  }, []);

  // Step form navigation state
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (selectedGuestHouse) {
      fetchRooms(selectedGuestHouse);
    }
    setFormData(prev => ({ ...prev, room: '', bed: '' }));
    setBeds([]);
  }, [selectedGuestHouse]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // When room changes, fetch beds
    if (name === 'room') {
      fetchBeds(value);
      setFormData(prev => ({ ...prev, bed: '' }));
    }
  };

  const fetchRooms = async (gh) => {
    try {
      setRoomsLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/rooms/by-guesthouse?guestHouseId=${gh.guestHouseId}`
      );
      setRooms(Array.isArray(res.data?.rooms) ? res.data.rooms : []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setRoomsError('Failed to load rooms');
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchBeds = async (roomId) => {
    try {
      setBedsLoading(true);
      const res = await axios.get(`http://localhost:5000/api/beds?roomId=${roomId}`);
      setBeds(Array.isArray(res.data?.beds) ? res.data.beds : []);
    } catch (err) {
      console.error('Error fetching beds:', err);
      setBedsError('Failed to load beds');
    } finally {
      setBedsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Booking submitted successfully!');
  };

  return (
    <div className="booking-bg">
      <Navbar />

      <div className="booking-page-container">
        {/* Step Indicator */}
        <div className="step-indicator">
          <span className={step === 1 ? 'active' : ''}>1. Booking Details</span>
          <span className={step === 2 ? 'active' : ''}>2. Personal Info</span>
        </div>

        {/* Step 1: Booking Details */}
        {step === 1 && (
          <form className="booking-form" onSubmit={() => setStep(2)}>
            {selectedGuestHouse && (
              <div className="selected-guesthouse-info">
                <h3>You Selected:</h3>
                <div className="guesthouse-details">
                  <h4>{selectedGuestHouse.guestHouseName}</h4>
                  <p>Location: {selectedGuestHouse.location.city}, {selectedGuestHouse.location.state}</p>
                </div>
              </div>
            )}

            <div className="form-section step-form">
              <h2>Booking Details</h2>
              <div className="form-grid">

                <div className="form-control">
                  <label>Check-in Date <span>*</span></label>
                  <input type="date" name="checkInDate" value={formData.checkInDate} onChange={handleChange} required />
                </div>

                <div className="form-control">
                  <label>Check-out Date <span>*</span></label>
                  <input type="date" name="checkOutDate" value={formData.checkOutDate} onChange={handleChange} required />
                </div>

                <div className="form-control">
                  <label>Room</label>
                  <select name="room" value={formData.room} onChange={handleChange} required>
                    <option value="">{roomsLoading ? 'Loading...' : 'Select Room'}</option>
                    {rooms.map((room) => (
                      <option key={room._id} value={room._id}>
                        Room {room.roomNumber} - {room.roomType}
                      </option>
                    ))}
                  </select>
                  {roomsError && <small className="error">{roomsError}</small>}
                </div>

                <div className="form-control full-width">
                  <label>Bed</label>
                  <select name="bed" value={formData.bed} onChange={handleChange} required>
                    <option value="">{bedsLoading ? 'Loading...' : 'Select Bed'}</option>
                    {beds.map((bed) => (
                      <option key={bed._id} value={bed._id}>
                        Bed {bed.bedNumber} - {bed.bedType}
                      </option>
                    ))}
                  </select>
                  {bedsError && <small className="error">{bedsError}</small>}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={() => window.history.back()}>Cancel</button>
                <button type="submit" className="btn primary">Next</button>
              </div>
            </div>
          </form>
        )}

        {/* Step 2: Personal Info */}
        {step === 2 && (
          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="form-section step-form">
              <h2>Personal Information</h2>

              <div className="form-grid">
                <div className="form-control full-width">
                  <label>Full Name <span>*</span></label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your name" required />
                </div>

                <div className="form-control">
                  <label>Email <span>*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your.email@example.com" required />
                </div>

                <div className="form-control">
                  <label>Phone <span>*</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 1234567890" required />
                </div>

                <div className="form-control full-width">
                  <label>Address <span>*</span></label>
                  <textarea name="address" value={formData.address} onChange={handleChange} rows="3" placeholder="Enter your full address" required></textarea>
                </div>

                <div className="form-control full-width">
                  <label>Special Requests (Optional)</label>
                  <textarea name="specialRequests" value={formData.specialRequests} onChange={handleChange} rows="3" placeholder="Any special requirements?"></textarea>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={() => setStep(1)}>Back</button>
                <button type="submit" className="btn primary">Send Request</button>
              </div>
            </div>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BookingForm;
