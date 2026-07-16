import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import api from '../../utils/api';
import '../styles/adminRoomBooking.css';

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const initialForm = {
  guestHouseId: '',
  roomId: '',
  bedId: '',
  checkIn: '',
  checkOut: '',
  fullName: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  identityType: '',
  identityNumber: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  specialRequests: '',
};

export default function AdminRoomBooking() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [guestHouses, setGuestHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [verificationImage, setVerificationImage] = useState(null);
  const [unavailableRooms, setUnavailableRooms] = useState([]);
  const [unavailableBeds, setUnavailableBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedGuestHouse = useMemo(
    () => guestHouses.find((guestHouse) => guestHouse._id === form.guestHouseId),
    [form.guestHouseId, guestHouses]
  );

  useEffect(() => {
    const fetchGuestHouses = async () => {
      try {
        const response = await api.get('/api/guesthouses');
        setGuestHouses(Array.isArray(response.data) ? response.data : response.data.guestHouses || []);
      } catch (error) {
        console.error('Error fetching guest houses:', error);
        toast.error('Unable to load guest houses.');
      } finally {
        setLoading(false);
      }
    };

    fetchGuestHouses();
  }, []);

  useEffect(() => {
    if (!selectedGuestHouse) {
      setRooms([]);
      return;
    }

    const fetchRooms = async () => {
      try {
        const response = await api.get('/api/rooms/by-guesthouse', {
          params: { guestHouseId: selectedGuestHouse.guestHouseId },
        });
        setRooms(response.data.rooms || []);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast.error('Unable to load rooms.');
      }
    };

    fetchRooms();
  }, [selectedGuestHouse]);

  useEffect(() => {
    if (!form.roomId) {
      setBeds([]);
      return;
    }

    const fetchBeds = async () => {
      try {
        const response = await api.get('/api/beds', { params: { roomId: form.roomId } });
        setBeds(response.data.beds || []);
      } catch (error) {
        console.error('Error fetching beds:', error);
        toast.error('Unable to load beds.');
      }
    };

    fetchBeds();
  }, [form.roomId]);

  useEffect(() => {
    if (!selectedGuestHouse || !form.checkIn || !form.checkOut || form.checkOut <= form.checkIn) {
      setUnavailableRooms([]);
      setUnavailableBeds([]);
      return;
    }

    const fetchAvailability = async () => {
      try {
        const response = await api.get('/api/bookings/availability', {
          params: {
            guestHouseId: selectedGuestHouse._id,
            checkIn: form.checkIn,
            checkOut: form.checkOut,
          },
        });
        setUnavailableRooms(response.data.unavailableRooms || []);
        setUnavailableBeds(response.data.unavailableBeds || []);
      } catch (error) {
        console.error('Error checking availability:', error);
        toast.error('Unable to check room availability.');
      }
    };

    fetchAvailability();
  }, [form.checkIn, form.checkOut, selectedGuestHouse]);

  const updateForm = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => {
      if (name === 'guestHouseId') {
        return { ...currentForm, guestHouseId: value, roomId: '', bedId: '' };
      }

      if (name === 'roomId') {
        return { ...currentForm, roomId: value, bedId: '' };
      }

      return { ...currentForm, [name]: value };
    });
  };

  const updateFamilyMember = (index, field, value) => {
    setFamilyMembers((members) => members.map((member, memberIndex) => (
      memberIndex === index ? { ...member, [field]: value } : member
    )));
  };

  const addFamilyMember = () => {
    setFamilyMembers((members) => [...members, { name: '', relation: '', age: '' }]);
  };

  const removeFamilyMember = (index) => {
    setFamilyMembers((members) => members.filter((_, memberIndex) => memberIndex !== index));
  };

  const submitBooking = async (event) => {
    event.preventDefault();

    if (form.checkOut <= form.checkIn) {
      toast.error('Check-out date must be after check-in date.');
      return;
    }

    if (!verificationImage) {
      toast.error('Upload a verification image before booking.');
      return;
    }

    const invalidFamilyMember = familyMembers.some((member) => !member.name || !member.relation || member.age === '');
    if (invalidFamilyMember) {
      toast.error('Complete or remove each family member row.');
      return;
    }

    const bookingData = new FormData();
    Object.entries(form).forEach(([key, value]) => bookingData.append(key, value));
    bookingData.append('familyMembers', JSON.stringify(familyMembers));
    bookingData.append('verificationImage', verificationImage);

    try {
      setSubmitting(true);
      await api.post('/api/bookings/admin', bookingData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Room booked successfully.');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error booking room:', error);
      toast.error(error.response?.data?.message || 'Unable to book this room.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-room-booking-page">
      <Navbar />
      <main className="admin-room-booking-content">
        <div className="admin-room-booking-heading">
          <h1>Book Room</h1>
          <p>Create an approved guest-house booking and record guest verification details.</p>
        </div>

        {loading ? <p>Loading booking form…</p> : (
          <form className="admin-room-booking-form" onSubmit={submitBooking}>
            <section>
              <h2>Stay Details</h2>
              <div className="admin-room-booking-grid">
                <label>
                  Guest House <span>*</span>
                  <select name="guestHouseId" value={form.guestHouseId} onChange={updateForm} required>
                    <option value="">Select guest house</option>
                    {guestHouses.filter((guestHouse) => !guestHouse.maintenance).map((guestHouse) => (
                      <option key={guestHouse._id} value={guestHouse._id}>{guestHouse.guestHouseName}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Room <span>*</span>
                  <select name="roomId" value={form.roomId} onChange={updateForm} required disabled={!selectedGuestHouse}>
                    <option value="">Select room</option>
                    {rooms.map((room) => (
                      <option key={room._id} value={room._id} disabled={unavailableRooms.includes(room._id)}>
                        Room {room.roomNumber} · {room.roomType}{unavailableRooms.includes(room._id) ? ' (Full)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Bed <span>*</span>
                  <select name="bedId" value={form.bedId} onChange={updateForm} required disabled={!form.roomId}>
                    <option value="">Select bed</option>
                    {beds.map((bed) => (
                      <option key={bed._id} value={bed._id} disabled={unavailableBeds.includes(bed._id)}>
                        Bed {bed.bedNumber} · {bed.bedType}{unavailableBeds.includes(bed._id) ? ' (Booked)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Check In <span>*</span>
                  <input type="date" name="checkIn" value={form.checkIn} min={today()} onChange={updateForm} required />
                </label>
                <label>
                  Check Out <span>*</span>
                  <input type="date" name="checkOut" value={form.checkOut} min={form.checkIn || today()} onChange={updateForm} required />
                </label>
              </div>
            </section>

            <section>
              <h2>Guest Details</h2>
              <div className="admin-room-booking-grid">
                <label>
                  Full Name <span>*</span>
                  <input name="fullName" value={form.fullName} onChange={updateForm} required />
                </label>
                <label>
                  Email <span>*</span>
                  <input type="email" name="email" value={form.email} onChange={updateForm} required />
                </label>
                <label>
                  Phone <span>*</span>
                  <input type="tel" name="phone" value={form.phone} onChange={updateForm} required />
                </label>
                <label>
                  Date of Birth
                  <input type="date" name="dateOfBirth" value={form.dateOfBirth} max={today()} onChange={updateForm} />
                </label>
                <label>
                  Gender
                  <select name="gender" value={form.gender} onChange={updateForm}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </label>
                <label>
                  Nationality
                  <input name="nationality" value={form.nationality} onChange={updateForm} />
                </label>
                <label className="admin-room-booking-full-width">
                  Address <span>*</span>
                  <textarea name="address" value={form.address} onChange={updateForm} rows="3" required />
                </label>
              </div>
            </section>

            <section>
              <h2>Identity & Emergency Contact</h2>
              <div className="admin-room-booking-grid">
                <label>
                  ID Type <span>*</span>
                  <select name="identityType" value={form.identityType} onChange={updateForm} required>
                    <option value="">Select ID type</option>
                    <option value="Aadhaar">Aadhaar</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving Licence">Driving Licence</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  ID Number <span>*</span>
                  <input name="identityNumber" value={form.identityNumber} onChange={updateForm} required />
                </label>
                <label>
                  Verification Image <span>*</span>
                  <input type="file" accept="image/*" onChange={(event) => setVerificationImage(event.target.files?.[0] || null)} required />
                  {verificationImage && <small>{verificationImage.name}</small>}
                </label>
                <label>
                  Emergency Contact Name
                  <input name="emergencyContactName" value={form.emergencyContactName} onChange={updateForm} />
                </label>
                <label>
                  Emergency Contact Phone
                  <input type="tel" name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={updateForm} />
                </label>
              </div>
            </section>

            <section>
              <div className="admin-room-booking-section-header">
                <div>
                  <h2>Family Details</h2>
                  <p>Add accompanying family members, if any.</p>
                </div>
                <button type="button" className="admin-room-booking-secondary" onClick={addFamilyMember}>Add Member</button>
              </div>
              {familyMembers.map((member, index) => (
                <div className="admin-room-booking-family-row" key={index}>
                  <input placeholder="Full name" value={member.name} onChange={(event) => updateFamilyMember(index, 'name', event.target.value)} />
                  <input placeholder="Relation" value={member.relation} onChange={(event) => updateFamilyMember(index, 'relation', event.target.value)} />
                  <input type="number" min="0" placeholder="Age" value={member.age} onChange={(event) => updateFamilyMember(index, 'age', event.target.value)} />
                  <button type="button" className="admin-room-booking-remove" onClick={() => removeFamilyMember(index)}>Remove</button>
                </div>
              ))}
            </section>

            <section>
              <h2>Additional Notes</h2>
              <label className="admin-room-booking-full-width">
                Special Requests
                <textarea name="specialRequests" value={form.specialRequests} onChange={updateForm} rows="3" />
              </label>
            </section>

            <div className="admin-room-booking-actions">
              <button type="button" className="admin-room-booking-secondary" onClick={() => navigate('/admin/dashboard')}>Cancel</button>
              <button type="submit" disabled={submitting}>{submitting ? 'Booking Room…' : 'Book Room'}</button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
