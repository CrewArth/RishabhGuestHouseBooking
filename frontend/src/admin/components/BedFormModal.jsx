import React, { useState, useEffect } from 'react';
import '../styles/bedFormModal.css';

const BedFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [bedData, setBedData] = useState({
    bedNumber: '',
    bedType: '',
  });

  useEffect(() => {
    if (initialData) {
      setBedData({
        bedNumber: initialData.bedNumber || '',
        bedType: initialData.bedType || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBedData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(bedData); // Pass data up to parent handler
    onClose();         // Close the modal
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <h2>{initialData ? 'Edit Bed' : 'Add New Bed'}</h2>

        <form onSubmit={handleSubmit} className="bed-form">
          <label>
            Bed Number
            <input
              type="number"
              name="bedNumber"
              value={bedData.bedNumber}
              onChange={handleChange}
              required
              min="1"
            />
          </label>

          <label>
            Bed Type
            <select
              name="bedType"
              value={bedData.bedType}
              onChange={handleChange}
              required
            >
              <option value="">Select Type</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="suite">Suite</option>
              
            </select>
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
