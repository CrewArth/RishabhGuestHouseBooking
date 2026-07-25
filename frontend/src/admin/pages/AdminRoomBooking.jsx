import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import api from '../../utils/api';
import loadingIcon from '../../assets/loading.svg';
import '../styles/adminRoomBooking.css';

const todayStr = () => new Date().toISOString().split('T')[0];

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

const STEPS = ['Stay Details', 'Guest Details', 'Identity & Emergency', 'Review & Confirm'];

export default function AdminRoomBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const editBookingId = location.state?.bookingId || null;  // set when coming from calendar Edit
  const isEditMode = !!editBookingId;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [guestHouses, setGuestHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);        // [{ name, relation, age, image: File|null }]
  const [verificationImage, setVerificationImage] = useState(null);
  const [unavailableRooms, setUnavailableRooms] = useState([]);
  const [unavailableBeds, setUnavailableBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignedGuestHouse, setAssignedGuestHouse] = useState(null);

  const selectedGuestHouse = useMemo(
    () => assignedGuestHouse || guestHouses.find((gh) => gh.guestHouseId === form.guestHouseId || gh._id === form.guestHouseId),
    [form.guestHouseId, guestHouses, assignedGuestHouse]
  );
  const selectedRoom = useMemo(() => rooms.find((r) => r._id === form.roomId), [form.roomId, rooms]);
  const selectedBed  = useMemo(() => beds.find((b) => b._id === form.bedId),   [form.bedId, beds]);

  // ── data fetching ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await api.get('/api/admin/me');
        const assigned = meRes.data.user?.assignedGuestHouseId;
        if (assigned) {
          setAssignedGuestHouse(assigned);
          // Assigned could be an object or just the guestHouseId string
          const guestHouseId = typeof assigned === 'object' ? assigned.guestHouseId : assigned;
          setForm((f) => ({ ...f, guestHouseId }));
        } else {
          const ghRes = await api.get('/api/guesthouses');
          setGuestHouses(Array.isArray(ghRes.data) ? ghRes.data : ghRes.data.guestHouses || []);
        }

        // If editing, load existing booking and prefill
        if (editBookingId) {
          const bRes = await api.get(`/api/bookings/${editBookingId}`);
          const b = bRes.data.booking;
          setForm({
            guestHouseId: b.guestHouseId || '',
            roomId:       b.roomId?._id        || b.roomId        || '',
            bedId:        b.bedId?._id         || b.bedId         || '',
            checkIn:      b.checkIn ? b.checkIn.split('T')[0] : '',
            checkOut:     b.checkOut ? b.checkOut.split('T')[0] : '',
            fullName:     b.fullName            || '',
            email:        b.email               || '',
            phone:        b.phone               || '',
            address:      b.address             || '',
            dateOfBirth:  b.dateOfBirth ? b.dateOfBirth.split('T')[0] : '',
            gender:       b.gender              || '',
            nationality:  b.nationality         || '',
            identityType: b.identityType        || '',
            identityNumber: b.identityNumber    || '',
            emergencyContactName:  b.emergencyContactName  || '',
            emergencyContactPhone: b.emergencyContactPhone || '',
            specialRequests: b.specialRequests  || '',
          });
          if (b.familyMembers?.length) {
            setFamilyMembers(b.familyMembers.map((m) => ({
              name: m.name, relation: m.relation, age: m.age ?? '', image: null,
            })));
          }
        }
      } catch { toast.error('Unable to load form data.'); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedGuestHouse) { setRooms([]); return; }
    api.get('/api/rooms/by-guesthouse', { params: { guestHouseId: selectedGuestHouse.guestHouseId } })
      .then((res) => setRooms(res.data.rooms || []))
      .catch(() => toast.error('Unable to load rooms.'));
  }, [selectedGuestHouse]);

  useEffect(() => {
    if (!form.roomId) { setBeds([]); return; }
    api.get('/api/beds', { params: { roomId: form.roomId } })
      .then((res) => setBeds(res.data.beds || []))
      .catch(() => toast.error('Unable to load beds.'));
  }, [form.roomId]);

  useEffect(() => {
    if (!selectedGuestHouse || !form.checkIn || !form.checkOut || form.checkOut <= form.checkIn) {
      setUnavailableRooms([]); setUnavailableBeds([]); return;
    }
    api.get('/api/bookings/availability', {
      params: { guestHouseId: selectedGuestHouse.guestHouseId || selectedGuestHouse._id, checkIn: form.checkIn, checkOut: form.checkOut },
    })
      .then((res) => { setUnavailableRooms(res.data.unavailableRooms || []); setUnavailableBeds(res.data.unavailableBeds || []); })
      .catch(() => toast.error('Unable to check availability.'));
  }, [form.checkIn, form.checkOut, selectedGuestHouse]);

  // ── helpers ─────────────────────────────────────────────────
  const updateForm = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      if (name === 'guestHouseId') return { ...f, guestHouseId: value, roomId: '', bedId: '' };
      if (name === 'roomId')       return { ...f, roomId: value, bedId: '' };
      return { ...f, [name]: value };
    });
  };

  const addMember    = () => setFamilyMembers((ms) => [...ms, { name: '', relation: '', age: '', image: null }]);
  const removeMember = (i) => setFamilyMembers((ms) => ms.filter((_, idx) => idx !== i));
  const updateMember = (i, field, value) =>
    setFamilyMembers((ms) => ms.map((m, idx) => idx === i ? { ...m, [field]: value } : m));

  const goNext = () => setStep((s) => s + 1);
  const goBack = () => setStep((s) => s - 1);

  const submitBooking = async () => {
    if (!isEditMode && !verificationImage) { toast.error('Upload a verification image before booking.'); return; }
    const invalid = familyMembers.some((m) => !m.name || !m.relation || m.age === '');
    if (invalid) { toast.error('Complete or remove each family member row.'); return; }

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') data.append(k, v); });
    data.append('familyMembers', JSON.stringify(familyMembers.map(({ name, relation, age }) => ({ name, relation, age }))));
    if (verificationImage) data.append('verificationImage', verificationImage);
    familyMembers.forEach((m, i) => {
      if (m.image) {
        const renamedFile = new File([m.image], `idx_${i}_${m.image.name}`, { type: m.image.type });
        data.append('familyMemberImages', renamedFile);
      }
    });

    try {
      setSubmitting(true);
      if (isEditMode) {
        await api.put(`/api/bookings/${editBookingId}/admin`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Booking updated successfully.');
      } else {
        await api.post('/api/bookings/admin', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Room booked successfully.');
      }
      // Wait a little for the toast to show before navigating
      setTimeout(() => navigate('/admin/dashboard'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to save booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  if (loading) return (
    <div className="arb-page"><Navbar /><main className="arb-content"><p className="arb-loading">Loading…</p></main></div>
  );

  return (
    <div className="arb-page">
      <Navbar />
      <main className="arb-content">

        {/* heading + stepper row */}
        <div className="arb-header-row">
          {/* heading */}
          <div className="arb-heading">
            <h1>{isEditMode ? 'Edit Booking' : 'Book Room'}</h1>
          </div>

          {/* stepper */}
          <div className="arb-stepper">
            {STEPS.map((label, i) => (
              <div key={i} className={`arb-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                <div className="arb-step-circle">{i < step ? '✓' : i + 1}</div>
                <span className="arb-step-label">{label}</span>
                {i < STEPS.length - 1 && <div className="arb-step-line" />}
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP 0 : Stay Details ── */}
        {step === 0 && (
          <form className="arb-card" onSubmit={(e) => { e.preventDefault(); goNext(); }}>
            <h2>Stay Details</h2>
            <div className="arb-grid">
              <label>
                Guest House <span>*</span>
                {assignedGuestHouse ? (
                  <input value={assignedGuestHouse.guestHouseName} disabled />
                ) : (
                  <select name="guestHouseId" value={form.guestHouseId} onChange={updateForm} required>
                    <option value="">Select guest house</option>
                    {guestHouses.filter((gh) => !gh.maintenance).map((gh) => (
                      <option key={gh._id} value={gh.guestHouseId}>{gh.guestHouseName}</option>
                    ))}
                  </select>
                )}
              </label>
              <label>
                Check In <span>*</span>
                <input type="date" name="checkIn" value={form.checkIn} min={todayStr()} onChange={updateForm} required />
              </label>
              <label>
                Check Out <span>*</span>
                <input type="date" name="checkOut" value={form.checkOut}
                  min={form.checkIn ? new Date(new Date(form.checkIn).getTime() + 86400000).toISOString().split('T')[0] : todayStr()}
                  onChange={updateForm} required />
              </label>
              <label>
                Room <span>*</span>
                <select name="roomId" value={form.roomId} onChange={updateForm} required disabled={!selectedGuestHouse}>
                  <option value="">Select room</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id} disabled={unavailableRooms.includes(r._id)}>
                      Room {r.roomNumber} · {r.roomType}{unavailableRooms.includes(r._id) ? ' (Booked)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Bed
                <select name="bedId" value={form.bedId} onChange={updateForm} disabled={!form.roomId}>
                  <option value="">Select bed (optional)</option>
                  {beds.map((b) => (
                    <option key={b._id} value={b._id} disabled={unavailableBeds.includes(b._id)}>
                      Bed {b.bedNumber} · {b.bedType}{unavailableBeds.includes(b._id) ? ' (Booked)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="arb-actions">
              <button type="button" className="arb-btn-secondary" onClick={() => navigate('/admin/dashboard')}>Cancel</button>
              <button type="submit" className="arb-btn-primary">Next →</button>
            </div>
          </form>
        )}

        {/* ── STEP 1 : Guest Details ── */}
        {step === 1 && (
          <form className="arb-card" onSubmit={(e) => { e.preventDefault(); goNext(); }}>
            <h2>Guest Details</h2>
            <div className="arb-grid">
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
                <input type="date" name="dateOfBirth" value={form.dateOfBirth} max={todayStr()} onChange={updateForm} />
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
              <label className="arb-full">
                Address <span>*</span>
                <textarea name="address" value={form.address} onChange={updateForm} rows="3" required />
              </label>
            </div>
            <div className="arb-actions">
              <button type="button" className="arb-btn-secondary" onClick={goBack}>← Back</button>
              <button type="submit" className="arb-btn-primary">Next →</button>
            </div>
          </form>
        )}

        {/* ── STEP 2 : Identity & Emergency ── */}
        {step === 2 && (
          <form className="arb-card" onSubmit={(e) => { e.preventDefault(); goNext(); }}>
            <h2>Identity & Emergency</h2>
            <div className="arb-grid">
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
                ID Number
                <input name="identityNumber" value={form.identityNumber} onChange={updateForm} />
              </label>
              <label>
                Verification Image {!isEditMode && <span>*</span>}
                <input type="file" accept="image/*"
                  onChange={(e) => setVerificationImage(e.target.files?.[0] || null)}
                  required={!isEditMode && !verificationImage} />
                {verificationImage
                  ? <small>{verificationImage.name}</small>
                  : isEditMode && <small style={{ color: '#64748b' }}>Leave empty to keep existing image</small>}
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

            {/* Family Members */}
            <div className="arb-section-header">
              <h2 className="arb-section-title" style={{ margin: 0 }}>Family Members</h2>
              <button type="button" className="arb-btn-add" onClick={addMember}>+ Add Member</button>
            </div>
            {familyMembers.length === 0 && <p className="arb-empty">No family members added.</p>}
            {familyMembers.map((m, i) => (
              <div className="arb-family-card" key={i}>
                <div className="arb-family-row">
                  <input placeholder="Full name" value={m.name}
                    onChange={(e) => updateMember(i, 'name', e.target.value)} />
                  <input placeholder="Relation" value={m.relation}
                    onChange={(e) => updateMember(i, 'relation', e.target.value)} />
                  <input type="number" min="0" placeholder="Age" value={m.age}
                    onChange={(e) => updateMember(i, 'age', e.target.value)} />
                  <button type="button" className="arb-btn-remove" onClick={() => removeMember(i)}>Remove</button>
                </div>
                <label className="arb-family-img-label">
                  Verification Document (optional)
                  <input type="file" accept="image/*"
                    onChange={(e) => updateMember(i, 'image', e.target.files?.[0] || null)} />
                  {m.image && <small>{m.image.name}</small>}
                </label>
              </div>
            ))}

            <h2 className="arb-section-title">Additional Notes</h2>
            <label className="arb-full">
              Special Requests
              <textarea name="specialRequests" value={form.specialRequests} onChange={updateForm} rows="3" />
            </label>

            <div className="arb-actions">
              <button type="button" className="arb-btn-secondary" onClick={goBack}>← Back</button>
              <button type="submit" className="arb-btn-primary">Next →</button>
            </div>
          </form>
        )}

        {/* ── STEP 3 : Review & Confirm ── */}
        {step === 3 && (
          <div className="arb-card">
            <h2>Review & Confirm</h2>
            <p className="arb-review-hint">Please review the booking details before confirming.</p>

            <div className="arb-review-section">
              <h3>Stay Details</h3>
              <div className="arb-review-grid">
                <div><span>Guest House</span><strong>{selectedGuestHouse?.guestHouseName || '—'}</strong></div>
                <div><span>Room</span><strong>{selectedRoom ? `Room ${selectedRoom.roomNumber} · ${selectedRoom.roomType}` : '—'}</strong></div>
                <div><span>Bed</span><strong>{selectedBed ? `Bed ${selectedBed.bedNumber} · ${selectedBed.bedType}` : '—'}</strong></div>
                <div><span>Check In</span><strong>{formatDate(form.checkIn)}</strong></div>
                <div><span>Check Out</span><strong>{formatDate(form.checkOut)}</strong></div>
              </div>
            </div>

            <div className="arb-review-section">
              <h3>Guest Details</h3>
              <div className="arb-review-grid">
                <div><span>Full Name</span><strong>{form.fullName || '—'}</strong></div>
                <div><span>Email</span><strong>{form.email || '—'}</strong></div>
                <div><span>Phone</span><strong>{form.phone || '—'}</strong></div>
                {form.dateOfBirth && <div><span>Date of Birth</span><strong>{formatDate(form.dateOfBirth)}</strong></div>}
                {form.gender && <div><span>Gender</span><strong style={{ textTransform: 'capitalize' }}>{form.gender.replace('_', ' ')}</strong></div>}
                {form.nationality && <div><span>Nationality</span><strong>{form.nationality}</strong></div>}
                <div className="arb-review-full"><span>Address</span><strong>{form.address || '—'}</strong></div>
              </div>
            </div>

            <div className="arb-review-section">
              <h3>Identity & Emergency</h3>
              <div className="arb-review-grid">
                <div><span>ID Type</span><strong>{form.identityType || '—'}</strong></div>
                {form.identityNumber && <div><span>ID Number</span><strong>{form.identityNumber}</strong></div>}
                <div><span>Verification Image</span><strong>{verificationImage?.name || '—'}</strong></div>
                {form.emergencyContactName && <div><span>Emergency Name</span><strong>{form.emergencyContactName}</strong></div>}
                {form.emergencyContactPhone && <div><span>Emergency Phone</span><strong>{form.emergencyContactPhone}</strong></div>}
              </div>
            </div>

            {familyMembers.length > 0 && (
              <div className="arb-review-section">
                <h3>Family Members</h3>
                <table className="arb-review-table">
                  <thead><tr><th>Name</th><th>Relation</th><th>Age</th><th>Document</th></tr></thead>
                  <tbody>
                    {familyMembers.map((m, i) => (
                      <tr key={i}>
                        <td>{m.name}</td>
                        <td>{m.relation}</td>
                        <td>{m.age}</td>
                        <td>{m.image ? m.image.name : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {form.specialRequests && (
              <div className="arb-review-section">
                <h3>Special Requests</h3>
                <p className="arb-review-note">{form.specialRequests}</p>
              </div>
            )}

            <div className="arb-actions">
              <button type="button" className="arb-btn-secondary" onClick={goBack}>← Back</button>
              <button type="button" className="arb-btn-primary" onClick={submitBooking} disabled={submitting}>
                {isEditMode ? 'Save Changes' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* ── Fullscreen loading overlay ── */}
        {submitting && (
          <div className="arb-loading-overlay">
            <img src={loadingIcon} alt="Processing…" className="arb-loading-icon" />
          </div>
        )}

      </main>
    </div>
  );
}
