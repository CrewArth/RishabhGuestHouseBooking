// src/components/RoomFormModal.jsx
import React, { useState, useEffect } from 'react';
import '../styles/roomFormModel.css';

const RoomFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [roomData, setRoomData] = useState({
    roomNumber: '',
    roomCapacity: '',
  });

  useEffect(() => {
    if (initialData) {
      setRoomData({
        roomNumber: initialData.roomNumber || '',
        roomCapacity: initialData.roomCapacity || '',
      });
    } else {
      setRoomData({ roomNumber: '', roomCapacity: '' });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRoomData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // basic client validation
    if (!roomData.roomNumber || !roomData.roomCapacity || Number(roomData.roomCapacity) < 1) {
      alert('Please provide a valid room number and capacity (min 1).');
      return;
    }
    onSubmit(roomData); // parent will supply guestHouseId & default roomType if needed
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <h2 className="modal-title">{initialData ? 'Edit Room' : 'Add New Room'}</h2>

        <form onSubmit={handleSubmit} className="room-form">
          <div className="form-group">
            <label>Room Number</label>
            <input type="number" name="roomNumber" value={roomData.roomNumber} onChange={handleChange} required min="1" />
          </div>

          <div className="form-group">
            <label>Room Capacity</label>
            <input type="number" name="roomCapacity" value={roomData.roomCapacity} onChange={handleChange} required min="1" />
          </div>

          <div className="room-form-buttons">
            <button type="button" className="btn cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn submit">{initialData ? 'Update Room' : 'Create Room'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomFormModal;
