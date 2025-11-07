import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import BedFormModal from '../components/BedFormModal';

import '../styles/bedManagement.css';

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
      console.log("API Response Beds:", response.data);
      setBeds(Array.isArray(response.data.beds) ? response.data.beds : []);
    } catch (error) {
      console.error("Error fetching beds:", error);
      setBeds([]); // fallback to empty array on error
    }
  };


  const handleAddBed = async (newBed) => {
    try {
      await axios.post('http://localhost:5000/api/beds', {
        ...newBed,
        roomId,
      });
      fetchBeds();  // Refresh the list
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding bed:', error);
    }
  };

  const handleEditBed = async (updatedBed) => {
    try {
      await axios.put(`http://localhost:5000/api/beds/${selectedBed._id}`, updatedBed);
      fetchBeds();
    } catch (error) {
      console.error('Error updating bed:', error);
    }
  };

  const toggleAvailability = async (bedId, currentAvailability) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/beds/${bedId}/availability`,
        { isAvailable: !currentAvailability }
      );

      fetchBeds(); // refresh list after update
    } catch (error) {
      console.error("Error toggling availability:", error);
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
    <div className="main-content">
      <h2>Beds for Room ID: {roomId}</h2>
      <button onClick={() => setIsModalOpen(true)}>Add New Bed</button>

      <table>
        <thead>
          <tr>
            <th>Bed Number</th>
            <th>Type</th>
            <th>Availability</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {beds.map((bed) => (
            <tr key={bed._id}>
              <td>{bed.bedNumber}</td>
              <td>{bed.bedType}</td>
              <td>{bed.isAvailable ? '✅ Yes' : '❌ No'}</td>
              <td>
                <button onClick={() => {
                  setSelectedBed(bed);
                  setIsModalOpen(true);
                }}>Edit</button>
                <button onClick={() => toggleAvailability(bed._id, bed.isAvailable)}>
                  Toggle Availability
                </button>
                <button onClick={() => handleDeleteBed(bed._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <BedFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedBed(null);
          }}
          onSubmit={selectedBed ? handleEditBed : handleAddBed}
          initialData={selectedBed}
        />
      )}
    </div>
  );
};

export default BedManagement;
