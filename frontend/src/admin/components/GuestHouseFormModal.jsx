import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/guestHouseModal.css';

const GuestHouseFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    guestHouseName: '',
    city: '',
    state: '',
    image: '',
    description: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        guestHouseName: initialData.guestHouseName || '',
        city: initialData.location?.city || '',
        state: initialData.location?.state || '',
        image: initialData.image || '',
        description: initialData.description || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      guestHouseName: formData.guestHouseName,
      location: {
        city: formData.city,
        state: formData.state,
      },
      image: formData.image,
      description: formData.description,
    };

    await onSubmit(payload);

    // Close modal if successful
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <h2>{initialData ? 'Edit Guest House' : 'Add New Guest House'}</h2>
        
        <form onSubmit={handleSubmit} className="gh-form">
          <label>
            Guest House Name
            <input
              type="text"
              name="guestHouseName"
              value={formData.guestHouseName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            City
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            State
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Image URL (optional)
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
            />
          </label>

          <label>
            Description (optional)
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            ></textarea>
          </label>

          <div className="gh-form-buttons">
            <button type="button" className="btn cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn submit">
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestHouseFormModal;