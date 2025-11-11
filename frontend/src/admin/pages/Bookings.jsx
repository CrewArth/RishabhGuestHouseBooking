import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/adminBooking.css";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/bookings");
      setBookings(Array.isArray(res.data?.bookings) ? res.data.bookings : res.data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // ✅ Helper function to safely format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return "—"; // Empty if no date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleAction = async (id, action, currentStatus) => {
    if (currentStatus !== "pending") {
      alert("This booking has already been processed and cannot be changed.");
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} this booking?`)) return;

    try {
      setActionLoadingId(id);
      setBookings((prev) =>
        prev.map((b) =>
          b._id === id
            ? { ...b, status: action === "approve" ? "approved" : "rejected" }
            : b
        )
      );

      await axios.patch(`http://localhost:5000/api/bookings/${id}/${action}`);
      await fetchBookings();
    } catch (err) {
      console.error(`Error ${action} booking:`, err);
      alert("Action failed. Check server logs.");
      await fetchBookings();
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) return <div className="admin-content"><p>Loading bookings...</p></div>;
  if (error) return <div className="admin-content"><p className="error">{error}</p></div>;
  // console.log(selected);
  return (
    <div className="admin-content admin-bookings-page">
      <div className="page-header">
        <strong><h1>Booking Requests</h1></strong>
        <p className="muted">Review & manage pending booking applications</p>
      </div>

      <div className="bookings-table-wrap">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Sr</th>
              <th>Guest House</th>
              <th>User</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Room</th>
              <th>Bed</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {bookings.length === 0 && (
              <tr><td colSpan="9" style={{ textAlign: "center" }}>No bookings found</td></tr>
            )}

            {bookings.map((b, idx) => (
              <tr key={b._id}>
                <td>{idx + 1}</td>
                <td>{b.guestHouseId?.guestHouseName || "—"}</td>
                <td>{`${b.userId?.firstName || ""}`}</td>
                <td>{new Date(b.checkIn).toLocaleDateString()}</td>
                <td>{new Date(b.checkOut).toLocaleDateString()}</td>
                <td>{b.roomId?.roomNumber ? `Room ${b.roomId.roomNumber}` : "—"}</td>
                <td>{b.bedId?.bedNumber ? `Bed ${b.bedId.bedNumber} (${b.bedId.bedType})` : "—"}</td>
                <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>

                <td className="actions-td">
                  <button onClick={() => setSelected(b)} className="btn small">View</button>

                  <button
                    onClick={() => handleAction(b._id, "approve", b.status)}
                    className="btn success small"
                    disabled={b.status !== "pending" || actionLoadingId === b._id}
                  >
                    {actionLoadingId === b._id ? "..." : "Approve"}
                  </button>

                  <button
                    onClick={() => handleAction(b._id, "reject", b.status)}
                    className="btn danger small"
                    disabled={b.status !== "pending" || actionLoadingId === b._id}
                  >
                    {actionLoadingId === b._id ? "..." : "Reject"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Booking Details</h3>
            <div className="detail-grid">
              <div><strong>Guest House</strong><div>{selected.guestHouseId?.guestHouseName || "—"}</div></div>
              <div><strong>User</strong><div>{selected.userId ? `${selected.userId.firstName} ${selected.userId.lastName}` : "—"}</div></div>
              <div><strong>Email</strong><div>{selected.userId?.email || "—"}</div></div>
              <div><strong>Check In</strong><div>{formatDate(selected.checkIn)}</div></div>
              <div><strong>Check Out</strong><div>{formatDate(selected.checkOut)}</div></div>
              <div><strong>Phone</strong><div>{selected.phone || "—"}</div></div>
              <div className="full"><strong>Address</strong><div>{selected.address || "—"}</div></div>
              <div className="full"><strong>Notes</strong><div>{selected.specialRequests || "—"}</div></div>
            </div>


            <div className="modal-actions">
              <button className="btn" onClick={() => setSelected(null)}>Close</button>
              {selected.status === "pending" && (
                <>
                  <button className="btn success" onClick={() => { handleAction(selected._id, "approve", selected.status); setSelected(null); }}>Approve</button>
                  <button className="btn danger" onClick={() => { handleAction(selected._id, "reject", selected.status); setSelected(null); }}>Reject</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
