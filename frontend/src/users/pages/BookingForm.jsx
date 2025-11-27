import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/bookingform.css';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { toast } from 'react-toastify';

const BookingForm = () => {
  const location = useLocation();
  const selectedGuestHouse = location.state?.guestHouse;
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem('user')) || null;

  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [bedsLoading, setBedsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState(null);
  const [bedsError, setBedsError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [unavailableRooms, setUnavailableRooms] = useState([]);
  const [unavailableBeds, setUnavailableBeds] = useState([]);

  const [dateError, setDateError] = useState(''); // ✅ NEW error state

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
      setFormData(prev => ({
        ...prev,
        fullName: `${storedUser.firstName} ${storedUser.lastName}`,
        email: storedUser.email,
        phone: storedUser.phone,
        address: storedUser.address || '',
      }));
    }
  }, []);

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

  // ✅ Validate dates in real-time
  const validateDates = (checkIn, checkOut) => {
    if (checkIn && checkOut) {
      if (new Date(checkOut) <= new Date(checkIn)) {
        setDateError("Check-out date must be after Check-in date");
        return false;
      }
    }
    setDateError('');
    return true;
  };

  // Modified handleChange to include validation
  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedData = {
      ...formData,
      [name]: value
    };

    setFormData(updatedData);

    // Run validation on each change
    if (name === "checkInDate" || name === "checkOutDate") {
      validateDates(
        name === "checkInDate" ? value : formData.checkInDate,
        name === "checkOutDate" ? value : formData.checkOutDate
      );
    }

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

  const checkAvailability = async () => {
    try {
      if (!formData.checkInDate || !formData.checkOutDate || !selectedGuestHouse) return;

      const res = await axios.get(`http://localhost:5000/api/bookings/availability`, {
        params: {
          guestHouseId: selectedGuestHouse._id || selectedGuestHouse.guestHouseId,
          checkIn: formData.checkInDate,
          checkOut: formData.checkOutDate,
        },
      });

      setUnavailableRooms(res.data.unavailableRooms || []);
      setUnavailableBeds(res.data.unavailableBeds || []);
    } catch (err) {
      console.error("Error checking availability:", err);
    }
  };

  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate && selectedGuestHouse) {
      checkAvailability();
    }
  }, [formData.checkInDate, formData.checkOutDate, selectedGuestHouse]);

  // Function to perform booking from user side.
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateDates(formData.checkInDate, formData.checkOutDate)) {
      alert("Please fix date validation errors before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const bookingData = {
        guestHouseId: selectedGuestHouse?._id || selectedGuestHouse?.guestHouseId,
        roomId: formData.room,
        bedId: formData.bed,
        checkIn: formData.checkInDate,
        checkOut: formData.checkOutDate,
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        specialRequests: formData.specialRequests,
        userId: storedUser?._id,
      };

      const res = await axios.post("http://localhost:5000/api/bookings", bookingData);
        
      console.log(res.data);
      if (res.status === 201) {
        // alert("Booking request submitted successfully!");
        toast.success("Booking request submitted successfully!", { autoClose: 1200 });
        setTimeout(() => {
          navigate('/my-bookings');
        }, 2500);
        
      } else {
        toast.error(res.data?.message || "Failed to submit booking")
      }
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast(error.response?.data?.message || "Server error submitting booking")
      
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-bg">
      <Navbar />

      <div className="booking-page-container">
        <div className="step-indicator">
          <span className={step === 1 ? 'active' : ''}>1. Booking Details</span>
          <span className={step === 2 ? 'active' : ''}>2. Personal Info</span>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <form className="booking-form" onSubmit={(e) => {
            e.preventDefault();
            if (!dateError) setStep(2);
          }}>
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
                  <input
                    type="date"
                    name="checkInDate"
                    value={formData.checkInDate}
                    onChange={handleChange}
                    required
                    className={dateError ? "error-input" : ""}
                  />
                </div>

                <div className="form-control">
                  <label>Check-out Date <span>*</span></label>
                  <input
                    type="date"
                    name="checkOutDate"
                    value={formData.checkOutDate}
                    onChange={handleChange}
                    required
                    className={dateError ? "error-input" : ""}
                    min={formData.checkInDate ? new Date(new Date(formData.checkInDate).getTime() + 86400000)
                      .toISOString()
                      .split("T")[0]
                      : ""}
                  />
                </div>

                <div className="form-control">
                  <label>Room</label>
                  <select name="room" value={formData.room} onChange={handleChange} required>
                    <option value="">{roomsLoading ? 'Loading...' : 'Select Room'}</option>
                    {rooms.map((room) => {
                      const isUnavailable = unavailableRooms.includes(room._id);
                      return (
                        <option key={room._id} value={room._id} disabled={isUnavailable}>
                          Room {room.roomNumber} - {room.roomType} {isUnavailable ? '(Full)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-control full-width">
                  <label>Bed</label>
                  <select name="bed" value={formData.bed} onChange={handleChange} required>
                    <option value="">{bedsLoading ? 'Loading...' : 'Select Bed'}</option>
                    {beds.map((bed) => {
                      const isUnavailable = unavailableBeds.includes(bed._id);
                      return (
                        <option key={bed._id} value={bed._id} disabled={isUnavailable}>
                          Bed {bed.bedNumber} - {bed.bedType} {isUnavailable ? '(Booked)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={() => window.history.back()}>Cancel</button>
                <button type="submit" className="btn primary" disabled={!!dateError}>
                  Next
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="form-section step-form">
              <h2>Personal Information</h2>

              <div className="form-grid">
                <div className="form-control full-width">
                  <label>Full Name <span>*</span></label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>

                <div className="form-control">
                  <label>Email <span>*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>

                <div className="form-control">
                  <label>Phone <span>*</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                </div>

                <div className="form-control full-width">
                  <label>Address <span>*</span></label>
                  <textarea name="address" value={formData.address} onChange={handleChange} rows="3" required></textarea>
                </div>

                <div className="form-control full-width">
                  <label>Special Requests (Optional)</label>
                  <textarea name="specialRequests" value={formData.specialRequests} onChange={handleChange} rows="3"></textarea>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={() => setStep(1)}>Back</button>

                <button type="submit" className="btn primary submit-btn" disabled={submitting}>
                  {submitting ? <div className="spinner"></div> : "Send Request"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingForm;
