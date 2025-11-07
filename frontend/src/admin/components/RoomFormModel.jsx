import React, { useState, useEffect } from 'react';
import '../styles/roomFormModel.css';

const RoomFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [roomData, setRoomData] = useState({
    roomNumber: '',
    roomType: '',
    roomCapacity: '',
  });

  useEffect(() => {
    if (initialData) {
      setRoomData({
        roomNumber: initialData.roomNumber || '',
        roomType: initialData.roomType || '',
        roomCapacity: initialData.roomCapacity || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRoomData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit(roomData); // parent handles backend call
    onClose();          // close modal
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <h2>{initialData ? 'Edit Room' : 'Add New Room'}</h2>

        <form onSubmit={handleSubmit} className="room-form">
          <label>
            Room Number
            <input
              type="number"
              name="roomNumber"
              value={roomData.roomNumber}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Room Type
            <select
              name="roomType"
              value={roomData.roomType}
              onChange={handleChange}
              required
            >
              <option value="">Select Type</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="family">Family</option>
            </select>
          </label>

          <label>
            Room Capacity
            <input
              type="number"
              name="roomCapacity"
              value={roomData.roomCapacity}
              onChange={handleChange}
              required
              min="1"
            />
          </label>

          <div className="room-form-buttons">
            <button type="button" className="btn cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn submit">{initialData ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomFormModal;
