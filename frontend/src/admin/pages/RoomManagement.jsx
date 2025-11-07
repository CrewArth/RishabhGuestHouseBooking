import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import RoomFormModal from '../components/RoomFormModel';
import '../styles/roomManagement.css';



const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const guestHouseId = searchParams.get('guestHouseId');

  useEffect(() => {
    if (!guestHouseId) {
      navigate('/admin/guesthouses');
      return;
    }
    fetchRooms();
  }, [guestHouseId]);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/rooms/by-guesthouse?guestHouseId=${guestHouseId}`);
      setRooms(response.data.rooms || []);
      console.log(response.data);
    } catch (error) {
      console.log("Error fetching rooms:", error);
      setRooms([]); // fallback to empty state on error
    }
  };

  const handleAddRoom = async (newRoom) => {
    try {
      await axios.post('http://localhost:5000/api/rooms', {
        ...newRoom,
        guestHouseId: Number(guestHouseId),
      });
      fetchRooms();
    } catch (error) {
      console.error('Error adding room:', error);
    }
  };

  const handleEditRoom = async (updatedRoom) => {
    try {
      await axios.put(`http://localhost:5000/api/rooms/${selectedRoom._id}`, updatedRoom);
      fetchRooms();
    } catch (error) {
      console.error('Error updating room:', error);
    }
  };

  const toggleRoomAvailability = async (roomId, currentStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/rooms/${roomId}/availability`, {
        isAvailable: !currentStatus   // flip top true/false
      });
      fetchRooms();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const deleteRoom = async (roomId) => {
  try {
    const confirmDelete = window.confirm('Are you sure you want to delete this room?');
    if (!confirmDelete) return;

    await axios.delete(`http://localhost:5000/api/rooms/${roomId}`);
    fetchRooms();
  } catch (error) {
    console.error('Error deleting room:', error);
  }
  };

  return (
    <div className="main-content">
      <h2>Rooms for Guest House ID: {guestHouseId}</h2>
      <button onClick={() => setIsModalOpen(true)}>Add New Room</button>

      <table>
        <thead>
          <tr>
            <th>Room Number</th>
            <th>Type</th>
            <th>Capacity</th>
            <th>Availability</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room._id}>
              <td>{room.roomNumber}</td>
              <td>{room.roomType}</td>
              <td>{room.roomCapacity}</td>
              <td>{room.isAvailable ? '✅ Yes' : '❌ No'}</td>
              <td>
                <button onClick={() => {
                  setSelectedRoom(room);
                  setIsModalOpen(true);
                }}>Edit</button>

                <button onClick={() => toggleRoomAvailability(room._id, room.isAvailable)}>
                  Toggle Availability
                </button>

                <button onClick={() => navigate(`/admin/beds?roomId=${room._id}`)}>Beds</button>

                <button
                  className="delete-btn"
                  onClick={() => deleteRoom(room._id)}
                  style={{ color: 'white', marginLeft: '5px' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <RoomFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRoom(null);
          }}
          onSubmit={selectedRoom ? handleEditRoom : handleAddRoom}
          initialData={selectedRoom}
        />
      )}

    </div>
  );
};

export default RoomManagement;
