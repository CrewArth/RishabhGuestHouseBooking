import React, { useEffect, useState } from "react";
import GuestHouseFormModal from "../components/GuestHouseFormModal";
import axios from "axios";
import "../styles/guestHouseManagement.css";
import { useNavigate } from "react-router-dom";
import { CiEdit } from "react-icons/ci";
import { BiHomeCircle } from "react-icons/bi";
import { PiHammer } from "react-icons/pi";
import { MdOutlineDeleteForever } from "react-icons/md";


const GuestHouseManagement = () => {
  const [guestHouses, setGuestHouses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGH, setSelectedGH] = useState(null);
  const navigate = useNavigate();

  const fetchGuestHouses = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/guesthouses");
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

  const handleAddGuestHouse = async (newGH) => {
    try {
      await axios.post("http://localhost:5000/api/guesthouses", newGH);
      fetchGuestHouses();
    } catch (err) {
      console.error("Error adding guest house:", err);
    }
  };

  const handleEditGuestHouse = async (updatedData) => {
    try {
      await axios.put(
        `http://localhost:5000/api/guesthouses/${selectedGH.guestHouseId}`,
        updatedData
      );
      fetchGuestHouses();
    } catch (err) {
      console.error("Error updating guest house:", err);
    }
  };

  const toggleMaintenance = async (guestHouseId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/guesthouses/${guestHouseId}/maintenance`
      );
      fetchGuestHouses();
    } catch (err) {
      console.error("Error toggling maintenance mode", err);
    }
  };

  const handleDeleteGuestHouse = async (guestHouseId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this guest house and all related data?"
      )
    ) {
      return;
    }

    const prev = guestHouses;
    setGuestHouses((list) =>
      list.filter((g) => g.guestHouseId !== guestHouseId)
    );

    try {
      await axios.delete(
        `http://localhost:5000/api/guesthouses/${guestHouseId}`
      );
    } catch (err) {
      console.error("Error deleting guest house:", err);
      setGuestHouses(prev);
      alert(
        err?.response?.data?.error || "Failed to delete. Check console for details."
      );
    } finally {
      fetchGuestHouses();
    }
  };

  return (
    <div className="gh-management-container">
      <div className="gh-header">
        <h1 className="gh-title">Guest House Management</h1>
        <button className="add-gh-btn" onClick={() => setIsModalOpen(true)}>
          + Add New Guest House
        </button>
      </div>

      <div className="gh-table-wrapper">
        <table className="gh-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Guest House Name</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {guestHouses.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  No guest houses found.
                </td>
              </tr>
            ) : (
              guestHouses.map((gh) => (
                <tr key={gh.guestHouseId}>
                  <td>{gh.guestHouseId}</td>
                  <td>{gh.guestHouseName}</td>
                  <td>
                    {gh.location.city}, {gh.location.state}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        gh.maintenance ? "maintenance" : "active"
                      }`}
                    >
                      {gh.maintenance ? "🛠️ Inactive" : "✅ Active"}
                    </span>
                  </td>
                  <td className="action-buttons">
  <button
    className="btn edit"
    data-tooltip="Edit"
    onClick={() => {
      setSelectedGH(gh);
      setIsModalOpen(true);
    }}
  >
   <b><CiEdit /></b>
  </button>

  <button
    className="btn rooms"
    data-tooltip="View Rooms"
    onClick={() => navigate(`/admin/rooms?guestHouseId=${gh.guestHouseId}`)}
  >
    <b><BiHomeCircle /></b>
  </button>

  <button
    className="btn maintenance"
    data-tooltip={gh.maintenance ? "Disable Maintenance" : "Enable Maintenance"}
    onClick={() => toggleMaintenance(gh.guestHouseId)}
  >
    <b><PiHammer /></b>
  </button>

  <button
    className="btn-delete"
    data-tooltip="Delete"
    onClick={() => handleDeleteGuestHouse(gh.guestHouseId)}
  >
    <b><MdOutlineDeleteForever /></b>
  </button>
</td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
