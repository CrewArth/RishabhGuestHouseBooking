// src/components/BedFormModal.jsx
import React, { useState, useEffect } from 'react';
import '../styles/bedFormModal.css';

const BedFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [bedData, setBedData] = useState({
    bedNumber: '',
  });

  useEffect(() => {
    if (initialData) {
      setBedData({
        bedNumber: initialData.bedNumber || ''
      });
    } else {
      setBedData({ bedNumber: '' });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBedData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bedData.bedNumber) return alert('Please enter bed number');
    // include bedType default when returning to parent
    onSubmit({ ...bedData, bedType: 'single' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <h2>{initialData ? 'Edit Bed' : 'Add New Bed'}</h2>

        <form onSubmit={handleSubmit} className="bed-form">
          <label>
            Bed Number
            <input type="number" name="bedNumber" value={bedData.bedNumber} onChange={handleChange} required min="1" />
          </label>

          <div className="bed-form-buttons">
            <button type="button" className="btn cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn submit">{initialData ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BedFormModal;
