import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import BedFormModal from '../components/BedFormModal';
import '../styles/bedManagement.css';
import '../styles/auditLogs.css'

const BedManagement = () => {
  const [beds, setBeds] = useState([]);
  const [selectedBed, setSelectedBed] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('roomId');

  useEffect(() => {
    if (!roomId) {
      navigate('/admin/rooms');
      return;
    }
    fetchBeds();
  }, [roomId]);

  const fetchBeds = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/beds?roomId=${roomId}`);
      setBeds(response.data.beds || []);
    } catch (error) {
      console.error('Error fetching beds:', error);
      setBeds([]);
    }
  };

  const handleAddBed = async (newBed) => {
    try {
      await axios.post('http://localhost:5000/api/beds', {
        ...newBed,
        roomId,
      });
      fetchBeds();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding bed:', error);
    }
  };

  const handleEditBed = async (updatedBed) => {
    try {
      await axios.put(`http://localhost:5000/api/beds/${selectedBed._id}`, updatedBed);
      fetchBeds();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating bed:', error);
    }
  };

  const toggleAvailability = async (bedId, currentAvailability) => {
    try {
      await axios.patch(`http://localhost:5000/api/beds/${bedId}/availability`, {
        isAvailable: !currentAvailability,
      });
      fetchBeds();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleDeleteBed = async (bedId) => {
    if (!window.confirm('Are you sure you want to delete this bed?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/beds/${bedId}`);
      fetchBeds();
    } catch (error) {
      console.error('Error deleting bed:', error);
    }
  };

  return (
    <div className="admin-content">
      <h2>Beds for Room ID: {roomId}</h2>

      <div className="toolbar">
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">Add New Bed</button>
        <button onClick={() => navigate(-1)} className="btn-secondary">Back</button>
      </div>

      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Bed Number</th>
              <th>Type</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {beds.length > 0 ? (
              beds.map((bed) => (
                <tr key={bed._id}>
                  <td>{bed.bedNumber}</td>
                  <td>{bed.bedType}</td>
                  <td>{bed.isAvailable ? '✅ Available' : '❌ Unavailable'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => { setSelectedBed(bed); setIsModalOpen(true); }}>Edit</button>
                    <button className="btn-warning" onClick={() => toggleAvailability(bed._id, bed.isAvailable)}>
                      Toggle Availability
                    </button>
                    <button className="btn-danger" onClick={() => handleDeleteBed(bed._id)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No beds available.</td></tr>
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
