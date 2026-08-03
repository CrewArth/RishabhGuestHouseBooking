import React, { useEffect, useState } from "react";
import GuestHouseFormModal from "../components/GuestHouseFormModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { toast } from "react-toastify";
import api from "../../utils/api";

const GuestHouseManagement = () => {
  const [guestHouses, setGuestHouses] = useState([]);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [selectedGH, setSelectedGH]    = useState(null);
  const [ghToDelete, setGhToDelete]    = useState(null);
  const MAX_GUEST_HOUSES = 4;
  const canAddMore = guestHouses.length < MAX_GUEST_HOUSES;

  const fetchGuestHouses = async () => {
    try {
      const res = await api.post("/api/guesthouses/list");
      setGuestHouses(Array.isArray(res.data) ? res.data : res.data.guestHouses || []);
    } catch (err) {
      console.error(err);
      setGuestHouses([]);
    }
  };

  useEffect(() => { fetchGuestHouses(); }, []);

  const handleAdd = async (payload) => {
    try {
      await api.post("/api/guesthouses", payload);
      toast.success("Guest House created successfully");
      fetchGuestHouses();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Error creating Guest House";
      toast.error(msg);
      throw err;
    }
  };

  const handleEdit = async (payload) => {
    try {
      await api.put(`/api/guesthouses/${selectedGH.guestHouseId}`, payload);
      toast.success("Guest House updated successfully");
      fetchGuestHouses();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Error updating Guest House";
      toast.error(msg);
      throw err;
    }
  };

  const toggleMaintenance = async (id) => {
    try {
      await api.patch(`/api/guesthouses/${id}/maintenance`);
      fetchGuestHouses();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to toggle maintenance mode";
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    const prev = guestHouses;
    setGuestHouses((list) => list.filter((g) => g.guestHouseId !== id));
    try {
      await api.delete(`/api/guesthouses/${id}`);
      toast.success("Guest House deleted successfully");
    } catch (err) {
      setGuestHouses(prev);
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to delete";
      toast.error(msg);
    } finally {
      fetchGuestHouses();
    }
  };

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Guest House Management</h1>
        </div>
        <button 
          className="btn-primary-cta" 
          onClick={() => setIsModalOpen(true)}
          disabled={!canAddMore}
          title={!canAddMore ? `Maximum limit of ${MAX_GUEST_HOUSES} guest houses reached` : ''}
        >
          Add Guest House {!canAddMore && `(${guestHouses.length}/${MAX_GUEST_HOUSES})`}
        </button>
      </div>  

      {/* Table */}
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>GH ID</th>
              <th>Name</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {guestHouses.length === 0 ? (
              <tr><td colSpan="5" className="table-empty">No guest houses found.</td></tr>
            ) : (
              guestHouses.map((gh) => (
                <tr key={gh.guestHouseId}>
                  <td>{gh.guestHouseId}</td>
                  <td>{gh.guestHouseName}</td>
                  <td>{gh.location.city}, {gh.location.state}</td>
                  <td>
                    <span className={`badge ${gh.maintenance ? "maintenance" : "active"}`}>
                      {gh.maintenance ? "Maintenance" : "Active"}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-action edit"   onClick={() => { setSelectedGH(gh); setIsModalOpen(true); }}>Edit</button>
                      <button className="btn-action toggle" onClick={() => toggleMaintenance(gh.guestHouseId)}>
                        {gh.maintenance ? "Activate" : "Maintenance"}
                      </button>
                      <button className="btn-action delete" onClick={() => setGhToDelete(gh.guestHouseId)}>Delete</button>
                    </div>
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
          onClose={() => { setIsModalOpen(false); setSelectedGH(null); }}
          onSubmit={selectedGH ? handleEdit : handleAdd}
          initialData={selectedGH}
        />
      )}

      {ghToDelete && (
        <ConfirmDeleteModal
          isOpen={!!ghToDelete}
          title="Delete Guest House"
          message="Are you sure you want to delete this guest house? This action will permanently remove all associated rooms and beds."
          onConfirm={() => {
            handleDelete(ghToDelete);
            setGhToDelete(null);
          }}
          onClose={() => setGhToDelete(null)}
        />
      )}
    </div>
  );
};

export default GuestHouseManagement;
