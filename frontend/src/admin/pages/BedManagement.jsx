// src/pages/BedManagement.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BedFormModal from '../components/BedFormModal';
import '../styles/bedManagement.css';
import '../styles/auditLogs.css';
import { toast } from 'react-toastify';

const BedManagement = () => {
  const [guestHouses, setGuestHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [selectedGH, setSelectedGH] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchGuestHouses();
  }, []);

  const fetchGuestHouses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/guesthouses');
      setGuestHouses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching guest houses', err);
    }
  };

  const fetchRoomsForGH = async (ghId) => {
    if (!ghId) {
      setRooms([]);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/rooms/by-guesthouse?guestHouseId=${ghId}`);
      setRooms(res.data.rooms || []);
    } catch (err) {
      console.error('Error fetching rooms for GH', err);
      setRooms([]);
    }
  };

  const fetchBedsForRoom = async (roomId) => {
    if (!roomId) {
      setBeds([]);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/beds?roomId=${roomId}`);
      setBeds(res.data.beds || []);
    } catch (err) {
      console.error('Error fetching beds', err);
      setBeds([]);
    }
  };

  useEffect(() => {
    if (selectedGH) {
      fetchRoomsForGH(selectedGH);
      setSelectedRoom(null);
      setBeds([]);
    }
  }, [selectedGH]);

  useEffect(() => {
    if (selectedRoom) {
      fetchBedsForRoom(selectedRoom);
    }
  }, [selectedRoom]);

  const handleAddBed = async (newBed) => {
    try {
      // client-side capacity check:
      const room = rooms.find(r => String(r._id) === String(selectedRoom));
      if (!room) return alert('Please select a valid room.');

      const activeBedsCount = beds.filter(b => b.isActive).length;
      if (activeBedsCount >= room.roomCapacity) {
        return alert(`Cannot add more beds. Room capacity is ${room.roomCapacity}.`);
      }

      const payload = {
        ...newBed,
        roomId: selectedRoom,
        bedType: newBed.bedType || 'single' // preserve schema but default single
      };

      const res = await axios.post('http://localhost:5000/api/beds', payload);
      toast.success("Bed created sucessfully")

      // server returns updated beds; prefer fetching to keep consistent
      fetchBedsForRoom(selectedRoom);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error adding bed', err);
      // alert(err?.response?.data?.error || 'Failed to add bed');
      toast.error(err?.response?.data?.error || 'Failed to add bed')
    }
  };

  const handleEditBed = async (updatedBed) => {
    try {
      await axios.put(`http://localhost:5000/api/beds/${selectedBed._id}`, {
        ...updatedBed,
        bedType: updatedBed.bedType || 'single'
      });
      fetchBedsForRoom(selectedRoom);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error updating bed', err);
      // alert('Failed to update bed');
      err?.response?.data?.error || 'Failed to update bed'
    }
  };

  const toggleAvailability = async (bedId, currentAvailability) => {
    try {
      await axios.patch(`http://localhost:5000/api/beds/${bedId}/availability`, {
        isAvailable: !currentAvailability
      });
      fetchBedsForRoom(selectedRoom);
    } catch (err) {
      console.error('Error toggling availability', err);
    }
  };

  const handleDeleteBed = async (bedId) => {
    if (!window.confirm('Are you sure you want to delete this bed?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/beds/${bedId}`);
      fetchBedsForRoom(selectedRoom);
    } catch (err) {
      console.error('Error deleting bed', err);
      // alert('Failed to delete bed');
      toast.error(err?.response?.data?.error || 'Failed to add bed')
    }
  };

  return (
    <div className="admin-content">
      <div className="rm-title">
      <strong><h2>Bed Management</h2></strong>
      </div>

      <div className="toolbar">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={selectedGH || ''} onChange={(e) => setSelectedGH(e.target.value || null)}>
            <option value="">-- Select Guest House --</option>
            {guestHouses.map(g => <option key={g.guestHouseId || g._id} value={g.guestHouseId || g._id}>{g.guestHouseName}</option>)}
          </select>

          <select value={selectedRoom || ''} onChange={(e) => setSelectedRoom(e.target.value || null)} disabled={!selectedGH}>
            <option value="">-- Select Room --</option>
            {rooms.map(r => <option key={r._id} value={r._id}>Room {r.roomNumber} (Cap: {r.roomCapacity})</option>)}
          </select>

          <button onClick={() => {
            if (!selectedRoom) return alert('Please select room first');
            setIsModalOpen(true);
          }} className="btn-primary">Add New Bed</button>

          <button onClick={() => navigate(-1)} className="btn-secondary">Back</button>
        </div>
      </div>

      <div className="table-container" style={{ marginTop: 16 }}>
        <table className="styled-table">
          <thead>
            <tr>
              <th>Bed Number</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {beds.length > 0 ? beds.map(b => (
              <tr key={b._id}>
                <td>{b.bedNumber}</td>
                <td>{b.isAvailable ? '✅ Available' : '❌ Under Maintanence'}</td>
                <td>
                  <button className="btn-edit" onClick={() => { setSelectedBed(b); setIsModalOpen(true); }}>Edit</button>
                  <button className="btn-warning" onClick={() => toggleAvailability(b._id, b.isAvailable)}>Toggle</button>
                  <button className="btn-danger" onClick={() => handleDeleteBed(b._id)}>Delete</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="3" style={{ textAlign: 'center' }}>No beds found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <BedFormModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedBed(null); }}
          onSubmit={selectedBed ? handleEditBed : handleAddBed}
          initialData={selectedBed}
        />
      )}
    </div>
  );
};

export default BedManagement;
