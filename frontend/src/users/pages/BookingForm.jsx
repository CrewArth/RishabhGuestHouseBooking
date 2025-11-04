import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/bookingform.css'
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const BookingForm = () => {
  const location = useLocation();
  const selectedGuestHouse = location.state?.guestHouse;

  const [formData, setFormData] = useState({
    checkInDate: '',
    checkOutDate: '',
    guestHouse: selectedGuestHouse || '',
    room: '',
    bed: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    specialRequests: ''
  });

  const guestHouses = [
    'Executive Guest House',
    'Deluxe Guest House',
    'Budget Guest House',
    'Family Guest House'
  ];

  const rooms = [
    'Room 101 - Single',
    'Room 102 - Double',
    'Room 201 - Suite',
    'Room 202 - Family Room'
  ];

  const beds = [
    'Single Bed',
    'Double Bed',
    'Twin Beds',
    'King Size Bed'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const bookingDataWithGuestHouse = {
      ...formData,
      selectedGuestHouse: selectedGuestHouse ? {
        name: selectedGuestHouse.name,
        location: selectedGuestHouse.location,
      } : null
    };
    console.log('Booking Data:', bookingDataWithGuestHouse);
    alert('Booking submitted successfully!');
  };

  return (
    <div> 
    <div className="booking-container">
      <div className="booking-form-wrapper">

        {/* Navbar */}
        <Navbar />

        {/* Selected Guest House Info */}
        {selectedGuestHouse && (
          <div className="selected-guesthouse-info">
            <h3>You Selected:</h3>
            <div className="guesthouse-details">
              <h4>{selectedGuestHouse.name}</h4>
              <p>Location: {selectedGuestHouse.location.city}, {selectedGuestHouse.location.state}</p>
              {selectedGuestHouse.description && <p className="description">{selectedGuestHouse.description}</p>}
            </div>
          </div>
        )}

        {/* Booking Form */}
        <form className="booking-form" onSubmit={handleSubmit}>

          {/* Booking Details Section */}
          <div className="form-section">
            <h2 className="section-title">Booking Details</h2>

            <div className="form-grid">
              {/* Check-in Date */}
              <div className="form-control">
                <label>Check-in Date <span className="required">*</span></label>
                <input
                  type="date"
                  name="checkInDate"
                  value={formData.checkInDate}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Check-out Date */}
              <div className="form-control">
                <label>Check-out Date <span className="required">*</span></label>
                <input
                  type="date"
                  name="checkOutDate"
                  value={formData.checkOutDate}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Guest House Selection */}
              <div className="form-control">
                <label>Guest House <span className="required">*</span></label>
                <select
                  name="guestHouse"
                  value={formData.guestHouse}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Guest House</option>
                  {guestHouses.map((house, index) => (
                    <option key={index} value={house}>{house}</option>
                  ))}
                </select>
              </div>

              {/* Room Selection */}
              <div className="form-control">
                <label>Room <span className="required">*</span></label>
                <select
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Room</option>
                  {rooms.map((room, index) => (
                    <option key={index} value={room}>{room}</option>
                  ))}
                </select>
              </div>

              {/* Bed Type Selection */}
              <div className="form-control full-width">
                <label>Bed Type <span className="required">*</span></label>
                <select
                  name="bed"
                  value={formData.bed}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Bed Type</option>
                  {beds.map((bed, index) => (
                    <option key={index} value={bed}>{bed}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="form-section">
            <h2 className="section-title">Personal Information</h2>

            <div className="form-grid">
              {/* Full Name */}
              <div className="form-control full-width">
                <label>Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div className="form-control">
                <label>Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Phone */}
              <div className="form-control">
                <label>Phone Number <span className="required">*</span></label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+91 1234567890"
                />
              </div>

              {/* Address */}
              <div className="form-control full-width">
                <label>Address <span className="required">*</span></label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Enter your complete address"
                />
              </div>

              {/* Special Requests */}
              <div className="form-control full-width">
                <label>Special Requests (Optional)</label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Any special requirements or requests..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="btn btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-confirm"
            >
              Send Request
            </button>
          </div>
        </form>

      </div>
      
    </div>

  <Footer />
    </div>

  );
};

export default BookingForm;