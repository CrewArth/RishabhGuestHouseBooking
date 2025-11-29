import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/adminBooking.css";
import { FaFileExcel } from "react-icons/fa";
import { toast } from "react-toastify";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [exportDate, setExportDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [isExporting, setIsExporting] = useState(false);


  const fetchBookings = async (silent = false) => {
    try {
      !silent && setLoading(true);
      silent && setRefreshing(true);

      const res = await axios.get("http://localhost:5000/api/bookings");
      setBookings(Array.isArray(res.data.bookings) ? res.data.bookings : res.data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings");
      setBookings([]);
    } finally {
      !silent && setLoading(false);
      silent && setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Auto-refresh every 12 seconds (but only if modal is closed)
    const interval = setInterval(() => {
      if (!selected && !actionLoadingId) {
        fetchBookings(true); // silent refresh
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [selected, actionLoadingId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-IN");
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await axios.get(
        "http://localhost:5000/api/bookings/export/daily",
        {
          params: { date: exportDate },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `bookings-${exportDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Bookings exported successfully.");
    } catch (err) {
      console.error("Error exporting bookings:", err);
      toast.error("Failed to export bookings for this day.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAction = async (id, action, currentStatus) => {
    if (currentStatus !== "pending") {
      toast.info("This booking has already been processed.");
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} this booking?`)) return;

    try {
      setActionLoadingId(id);

      await axios.patch(`http://localhost:5000/api/bookings/${id}/${action}`);
      await fetchBookings();
      toast.success(`Booking ${action === "approve" ? "approved" : "rejected"} successfully.`);
    } catch (err) {
      console.error(`Error ${action} booking:`, err);
      toast.error("Action failed. Check server logs.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading)
    return <div className="admin-content"><p>Loading bookings...</p></div>;

  if (error)
    return <div className="admin-content"><p className="error">{error}</p></div>;

  return (
    <div className="admin-content admin-bookings-page">
      <div className="page-header">
        <div className="bk-title">
          <h2>Booking Requests</h2>
        </div>
        <div className="booking-export-wrapper">
          <input
            type="date"
            className="booking-export-date"
            value={exportDate}
            onChange={(e) => setExportDate(e.target.value)}
          />
          <button
            className="booking-export-btn"
            onClick={handleExport}
            disabled={isExporting || !exportDate}
          >
            <span className="export-icon" aria-hidden="true">
              <FaFileExcel />
            </span>
            {isExporting ? "Generating..." : "Export"}
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <label>Status: </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>


      {refreshing && <p style={{ color: "gray", fontSize: "13px" }}>Refreshing…</p>}

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

            {bookings
              .filter((b) => {
                if (statusFilter === "all") return true;
                return b.status === statusFilter;
              })
              .map((b, idx) => (
              <tr key={b._id}>
                <td>{idx + 1}</td>
                <td>{b.guestHouseId?.guestHouseName || "—"}</td>
                <td>{b.userId?.firstName || "—"}</td>
                <td>{formatDate(b.checkIn)}</td>
                <td>{formatDate(b.checkOut)}</td>
                <td>{b.roomId?.roomNumber ? `Room ${b.roomId.roomNumber}` : "—"}</td>
                <td>{b.bedId?.bedNumber ? `Bed ${b.bedId.bedNumber} (${b.bedId.bedType})` : "—"}</td>

                <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>

                <td className="actions-td">

  {/* Show Approve + Reject ONLY when status is pending */}
  {b.status === "pending" && (
    <>
      <button
        onClick={() => handleAction(b._id, "approve", b.status)}
        className="btn success small"
        disabled={actionLoadingId === b._id}
      >
        {actionLoadingId === b._id ? "..." : "Approve"}
      </button>

      <button
        onClick={() => handleAction(b._id, "reject", b.status)}
        className="btn danger small"
        disabled={actionLoadingId === b._id}
      >
        {actionLoadingId === b._id ? "..." : "Reject"}
      </button>
    </>
  )}

    {/* Always show VIEW button */}
  <button
    onClick={() => setSelected(b)}
    className="btn small"
  >
    View
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

      <div className="modal-details">

        <p><strong>User:</strong> {selected.userId?.firstName} {selected.userId?.lastName}</p>
        <p><strong>Email:</strong> {selected.userId?.email}</p>

        <p><strong>Guest House:</strong> {selected.guestHouseId?.guestHouseName}</p>
        <p><strong>Room:</strong> {selected.roomId?.roomNumber ? `Room ${selected.roomId.roomNumber}` : "—"}</p>
        <p><strong>Bed:</strong> 
          {selected.bedId?.bedNumber 
            ? `Bed ${selected.bedId.bedNumber} (${selected.bedId.bedType})` 
            : "—"}
        </p>

        <p><strong>Check-In:</strong> {formatDate(selected.checkIn)}</p>
        <p><strong>Check-Out:</strong> {formatDate(selected.checkOut)}</p>

        <p><strong>Status:</strong> 
          <span className={`status-badge ${selected.status}`} style={{ marginLeft: 6 }}>
            {selected.status}
          </span>
        </p>

        {selected.specialRequests && (
          <p><strong>Special Requests:</strong> {selected.specialRequests}</p>
        )}

        <p><strong>Applied On:</strong> {formatDate(selected.createdAt)}</p>

      </div>

      <div className="modal-actions">
        <button className="btn" onClick={() => setSelected(null)}>Close</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Bookings;
