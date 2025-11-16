// src/pages/RoomManagement.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import RoomFormModal from '../components/RoomFormModel';
import '../styles/roomManagement.css';
import { toast } from 'react-toastify';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestHouse, setGuestHouse] = useState(null);
  const [guestHouses, setGuestHouses] = useState([]);
  const [selectedGHId, setSelectedGHId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const ghFromQuery = searchParams.get('guestHouseId');

  // Load list of guest houses for dropdown
  const fetchGuestHouses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/guesthouses');
      setGuestHouses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching guest houses:', err);
    }
  };

  // Load guest house information when selected
  const fetchGuestHouse = async (id) => {
    if (!id) {
      setGuestHouse(null);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/guesthouses/${id}`);
      setGuestHouse(res.data.guestHouse || null);
    } catch (err) {
      console.error('Error fetching guest house:', err);
      setGuestHouse(null);
    }
  };

  const fetchRooms = async (ghId) => {
    if (!ghId) {
      setRooms([]);
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/rooms/by-guesthouse?guestHouseId=${ghId}`
      );
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.log('Error fetching rooms:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // init
  useEffect(() => {
    fetchGuestHouses();

    if (ghFromQuery) {
      // if URL provided guestHouseId, use it
      setSelectedGHId(ghFromQuery);
      fetchGuestHouse(ghFromQuery);
      fetchRooms(ghFromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghFromQuery]);

  // when user picks from dropdown
  useEffect(() => {
    if (selectedGHId) {
      fetchGuestHouse(selectedGHId);
      fetchRooms(selectedGHId);
    } else {
      setGuestHouse(null);
      setRooms([]);
    }
  }, [selectedGHId]);

  const handleAddRoom = async (newRoom) => {
    try {
      // Hide roomType from UI; default it to "single" on submission
      const payload = {
        ...newRoom,
        roomType: newRoom.roomType || 'single',
        guestHouseId: Number(selectedGHId),
      };
      await axios.post('http://localhost:5000/api/rooms', payload);
      toast.success("Room created sucessfully")
      fetchRooms(selectedGHId);
    } catch (error) {
      console.error('Error adding room:', error);
      toast.error(error?.response?.data?.message || 'Failed to add room')
    }
  };

  const handleEditRoom = async (updatedRoom) => {
    try {
      await axios.put(
        `http://localhost:5000/api/rooms/${selectedRoom._id}`,
        {
          ...updatedRoom,
          // ensure roomType remains in payload server-side; keep unchanged if not provided
          roomType: updatedRoom.roomType || 'single'
        }
      );
      fetchRooms(selectedGHId);
    } catch (error) {
      console.error('Error updating room:', error);
      toast.error(error?.response?.data?.message || 'Failed to update room')
    }
  };

  const toggleRoomAvailability = async (roomId, currentStatus) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/rooms/${roomId}/availability`,
        {
          isAvailable: !currentStatus,
        }
      );
      fetchRooms(selectedGHId);
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const deleteRoom = async (roomId) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this room?');
      if (!confirmDelete) return;
      await axios.delete(`http://localhost:5000/api/rooms/${roomId}`);
      toast.success("Room deleted sucessfully")
      fetchRooms(selectedGHId);
    } catch (error) {
      console.error('Error deleting room:', error);
      // alert('Failed to delete room');
      toast.error(error?.response?.data?.message || 'Failed to delete room')
    }
  };

  return (
    <div className="gh-management-container">
      <div className="gh-header">
        <h2 className="gh-title">
          Room Management - {guestHouse ? guestHouse.guestHouseName : (selectedGHId ? 'Loading...' : 'Select Guest House')}
        </h2>

        <div className="gh-header-controls">
          <select
            value={selectedGHId || ''}
            onChange={(e) => setSelectedGHId(e.target.value || null)}
            className="gh-select"
          >
            <option value="">-- Select Guest House --</option>
            {guestHouses.map((g) => (
              <option key={g.guestHouseId || g._id} value={g.guestHouseId || g._id}>
                {g.guestHouseName}
              </option>
            ))}
          </select>

          <button
            className="add-gh-btn"
            onClick={() => {
              if (!selectedGHId) {
                alert('Please select a Guest House first.');
                return;
              }
              setIsModalOpen(true);
            }}
            disabled={!selectedGHId}
          >
            + Add New Room
          </button>
        </div>
      </div>

      <div className="gh-table-container">
        {loading ? (
          <div style={{ padding: 20 }}>Loading rooms...</div>
        ) : (
          <table className="gh-table">
            <thead>
              <tr>
                <th>Room Number</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>
                    No rooms found.
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room._id}>
                    <td>{room.roomNumber}</td>
                    <td>{room.roomCapacity}</td>
                    <td>{room.isAvailable ? '✅ Available' : '❌ Under Maintanence'}</td>
                    <td className="action-buttons">
                      <button onClick={() => { setSelectedRoom(room); setIsModalOpen(true); }} title="Edit">
                        Edit
                      </button>

                      <button onClick={() => toggleRoomAvailability(room._id, room.isAvailable)} title="Toggle Availability">
                        Toggle
                      </button>

                      <button className="delete-btn" onClick={() => deleteRoom(room._id)} title="Delete">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <RoomFormModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedRoom(null); }}
          onSubmit={selectedRoom ? handleEditRoom : handleAddRoom}
          initialData={selectedRoom}
        />
      )}
    </div>
  );
};

export default RoomManagement;
