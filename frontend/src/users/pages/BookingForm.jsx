import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/bookingform.css'
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import axios from 'axios';

const BookingForm = () => {
  const location = useLocation();
  const selectedGuestHouse = location.state?.guestHouse;
  // console.log("DAMM",selectedGuestHouse);
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
    fullName: '',
    email: '',
    phone: '',
    address: '',
    specialRequests: ''
  });

  useEffect(() => {
    // when user comes from card click, selectedGuestHouse has full object
    if (selectedGuestHouse) {
      fetchRooms(selectedGuestHouse);
    }
    // reset room/bed selections when GH changes
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

    // When room changes, fetch beds for that room (_id)
    if (name === 'room') {
      fetchBeds(value);       // value is roomId from the <option value=...>
      // clear selected bed when room changes
      setFormData(prev => ({ ...prev, bed: '' }));
    }
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

  const fetchRooms = async (gh) => {
    if (!gh?.guestHouseId) {
      setRooms([]);
      return;
    }
    try {
      setRoomsLoading(true);
      setRoomsError(null);
      const res = await axios.get(
        `http://localhost:5000/api/rooms/by-guesthouse?guestHouseId=${gh.guestHouseId}`
      );
      const list = Array.isArray(res.data?.rooms) ? res.data.rooms : [];
      setRooms(list);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setRoomsError(err?.response?.data?.error || 'Failed to load rooms');
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchBeds = async (roomId) => {
    if (!roomId) {
      setBeds([]);
      return;
    }
    try {
      setBedsLoading(true);
      setBedsError(null);
      const res = await axios.get(`http://localhost:5000/api/beds?roomId=${roomId}`);
      const list = Array.isArray(res.data?.beds) ? res.data.beds
        : Array.isArray(res.data) ? res.data
          : [];
      setBeds(list);
    } catch (err) {
      console.error('Error fetching beds:', err);
      setBedsError(err?.response?.data?.error || 'Failed to load beds');
      setBeds([]);
    } finally {
      setBedsLoading(false);
    }
  };


  return (
    <div>
      <div className="booking-container">
        {/* Navbar */}
        <Navbar />

        <div className="booking-form-wrapper">
          {/* Selected Guest House Info */}
          {/* Selected Guest House Info */}
          {selectedGuestHouse && (
            <div className="selected-guesthouse-info">
              <h3>You Selected:</h3>
              <div className="guesthouse-details">
                <h4>{selectedGuestHouse.guestHouseName}</h4>
                <p>Location: {selectedGuestHouse.location.city}, {selectedGuestHouse.location.state}</p>
                {selectedGuestHouse.description && (
                  <p className="description">{selectedGuestHouse.description}</p>
                )}
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
                    value={selectedGuestHouse?.guestHouseName || ''}
                    onChange={() => { }}
                    disabled
                  >
                    <option value="">{selectedGuestHouse ? selectedGuestHouse.guestHouseName : 'Select Guest House'}</option>
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
                    disabled={roomsLoading || rooms.length === 0}
                  >
                    <option value="">
                      {roomsLoading ? 'Loading rooms...' : rooms.length ? 'Select Room' : 'No rooms available'}
                    </option>
                    {rooms.map((room) => (
                      <option key={room._id} value={room._id}>
                        Room {room.roomNumber} — {room.roomType} (Cap: {room.roomCapacity})
                      </option>
                    ))}
                  </select>
                  {roomsError && <small className="field-error">{roomsError}</small>}
                </div>


                {/* Bed Type Selection */}
                <div className="form-control full-width">
                  <label>Bed <span className="required">*</span></label>
                  <select
                    name="bed"
                    value={formData.bed}
                    onChange={handleChange}
                    required
                    disabled={!formData.room || bedsLoading || beds.length === 0}
                  >
                    <option value="">
                      {!formData.room ? 'Select a room first'
                        : bedsLoading ? 'Loading beds...'
                          : beds.length ? 'Select Bed'
                            : 'No beds available'}
                    </option>
                    {beds.map((bed) => (
                      <option key={bed._id} value={bed._id}>
                        Bed #{bed.bedNumber} — {bed.bedType} {bed.isAvailable ? '' : '(Unavailable)'}
                      </option>
                    ))}
                  </select>
                  {bedsError && <small className="field-error">{bedsError}</small>}
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