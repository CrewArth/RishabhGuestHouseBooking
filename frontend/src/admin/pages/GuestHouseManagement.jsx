import React, { useEffect, useState } from 'react';
import GuestHouseFormModal from '../components/GuestHouseFormModal';
import axios from 'axios';
import '../styles/guestHouseManagement.css';
import { useNavigate } from 'react-router-dom';


const GuestHouseManagement = () => {

  const [guestHouses, setGuestHouses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGH, setSelectedGH] = useState(null);

  const navigate = useNavigate();

  const fetchGuestHouses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/guesthouses');
      console.log('API Response:', response.data);

      setGuestHouses(
        Array.isArray(response.data) ? response.data : response.data.guestHouses
      );
    } catch (err) {
      console.error("Error fetching guest houses:", err);
      setGuestHouses([]);
    }
  };

  useEffect(() => {
    fetchGuestHouses();
  }, []);

  // Add New Guest House handler
  const handleAddGuestHouse = async (newGH) => {
    try {
      await axios.post('http://localhost:5000/api/guesthouses', newGH);
      fetchGuestHouses(); // Refresh the list after adding
    } catch (err) {
      console.error("Error adding guest house:", err);
    }
  };

  // Edit Guest House handler
  const handleEditGuestHouse = async (updatedData) => {
    try {
      await axios.put(
        `http://localhost:5000/api/guesthouses/${selectedGH.guestHouseId}`,
        updatedData
      );
      fetchGuestHouses(); // Refresh the list after updating
    } catch (err) {
      console.error("Error updating guest house:", err);
    }
  };

  const toggleMaintenance = async (guestHouseId) => {
    try {
      await axios.patch(`http://localhost:5000/api/guesthouses/${guestHouseId}/maintenance`);
      fetchGuestHouses(); // Refresh
    } catch (err) {
      console.error("Error toggling maintenance mode", err);
    }
  };

  const handleDeleteGuestHouse = async (guestHouseId) => {
  if (!window.confirm("Are you sure you want to delete this guest house and all related data?")) {
    return;
  }
  try {
    await axios.delete(`http://localhost:5000/api/guesthouses/${guestHouseId}`);
    fetchGuestHouses(); // refresh UI
    alert("Guest House and related data deleted successfully.");
  } catch (err) {
    console.error("Error deleting guest house:", err);
    alert("Failed to delete. Check console for details.");
  }
};



  return (
    <div className="main-content">
      <button onClick={() => setIsModalOpen(true)}>Add New Guest House</button>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Location</th>
            <th>Maintenance Mode</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {guestHouses.map((gh) => (
            <tr key={gh.guestHouseId}>
              <td>{gh.guestHouseId}</td>
              <td>{gh.guestHouseName}</td>
              <td>{`${gh.location.city}, ${gh.location.state}`}</td>
              <td>{gh.maintenance ? '🛠️ On' : '✅ Off'}</td>
              <td>
                <button onClick={() => {
                  setSelectedGH(gh); // Set the clicked guest house as selected
                  setIsModalOpen(true); // Open modal in edit mode
                }}>
                  Edit
                </button>

                <button onClick={() => navigate(`/admin/rooms?guestHouseId=${gh.guestHouseId}`)}>
                  Rooms
                </button>


                <button onClick={() => toggleMaintenance(gh.guestHouseId)}>
                  Toggle Maintenance
                </button>

                <button
                  className="delete-btn"
                  onClick={() => handleDeleteGuestHouse(gh.guestHouseId)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <GuestHouseFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedGH(null);
          }}
          onSubmit={selectedGH ? handleEditGuestHouse : handleAddGuestHouse}
          initialData={selectedGH}
        />
      )}

    </div>
  );
};

export default GuestHouseManagement;
