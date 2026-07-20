import React, { useEffect, useState } from "react";
import { FaFileExcel } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../utils/api";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN");
};

const Bookings = () => {
  const [bookings, setBookings]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [error, setError]                 = useState("");
  const [selected, setSelected]           = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusFilter, setStatusFilter]   = useState("all");
  const [exportDate, setExportDate]       = useState(() => new Date().toISOString().slice(0, 10));
  const [isExporting, setIsExporting]     = useState(false);

  const fetchBookings = async (silent = false) => {
    try {
      !silent ? setLoading(true) : setRefreshing(true);
      const res = await api.get("/api/bookings");
      setBookings(Array.isArray(res.data.bookings) ? res.data.bookings : res.data || []);
    } catch (err) {
      setError("Failed to load bookings");
      setBookings([]);
    } finally {
      !silent ? setLoading(false) : setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const id = setInterval(() => { if (!selected && !actionLoadingId) fetchBookings(true); }, 12000);
    return () => clearInterval(id);
  }, [selected, actionLoadingId]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await api.get("/api/bookings/export/daily", { params: { date: exportDate }, responseType: "blob" });
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bookings-${exportDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Exported successfully");
    } catch { toast.error("Export failed"); }
    finally { setIsExporting(false); }
  };

  const handleAction = async (id, action, currentStatus) => {
    if (currentStatus !== "pending") return toast.info("Already processed.");
    if (!window.confirm(`${action === "approve" ? "Approve" : "Reject"} this booking?`)) return;
    try {
      setActionLoadingId(id);
      await api.patch(`/api/bookings/${id}/${action}`);
      toast.success(`Booking ${action === "approve" ? "approved" : "rejected"}`);
      fetchBookings();
    } catch { toast.error("Action failed"); }
    finally { setActionLoadingId(null); }
  };

  const filtered = bookings.filter((b) => statusFilter === "all" || b.status === statusFilter);

  if (loading) return <div className="page-root"><p style={{ color: "#64748b" }}>Loading bookings…</p></div>;
  if (error)   return <div className="page-root"><p style={{ color: "#dc2626" }}>{error}</p></div>;

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="page-subtitle">Review, approve and export booking requests</p>
        </div>
        <div className="export-row">
          <input
            type="date"
            className="export-date-input"
            value={exportDate}
            onChange={(e) => setExportDate(e.target.value)}
          />
          <button
            className="btn-action export"
            onClick={handleExport}
            disabled={isExporting || !exportDate}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.875rem' }}
          >
            <FaFileExcel />
            {isExporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="toolbar-row">
        <span className="toolbar-label">Status:</span>
        <select className="toolbar-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        {refreshing && <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Refreshing…</span>}
      </div>

      {/* Table */}
      <div className="table-scroll">
        <table className="data-table" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th className="center">#</th>
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
            {filtered.length === 0 ? (
              <tr><td colSpan="9" className="table-empty">No bookings found</td></tr>
            ) : (
              filtered.map((b, i) => (
                <tr key={b._id}>
                  <td className="center">{i + 1}</td>
                  <td>{b.guestHouseId?.guestHouseName || "—"}</td>
                  <td>{b.userId?.firstName || "—"}</td>
                  <td>{formatDate(b.checkIn)}</td>
                  <td>{formatDate(b.checkOut)}</td>
                  <td>{b.roomId?.roomNumber ? `Room ${b.roomId.roomNumber}` : "—"}</td>
                  <td>{b.bedId?.bedNumber ? `Bed ${b.bedId.bedNumber}` : "—"}</td>
                  <td><span className={`badge ${b.status}`}>{b.status}</span></td>
                  <td>
                    <div className="actions-cell">
                      {b.status === "pending" && (
                        <>
                          <button
                            className="btn-action approve"
                            disabled={actionLoadingId === b._id}
                            onClick={() => handleAction(b._id, "approve", b.status)}
                          >
                            {actionLoadingId === b._id ? "…" : "Approve"}
                          </button>
                          <button
                            className="btn-action reject"
                            disabled={actionLoadingId === b._id}
                            onClick={() => handleAction(b._id, "reject", b.status)}
                          >
                            {actionLoadingId === b._id ? "…" : "Reject"}
                          </button>
                        </>
                      )}
                      <button className="btn-action view" onClick={() => setSelected(b)}>View</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="page-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="page-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="page-modal-header">
              <h3>Booking Details</h3>
              <button className="page-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="page-modal-body">
              <div className="modal-detail-grid">
                <p><strong>User</strong>{selected.userId?.firstName} {selected.userId?.lastName}</p>
                <p><strong>Email</strong>{selected.userId?.email || "—"}</p>
                <p><strong>Guest House</strong>{selected.guestHouseId?.guestHouseName || "—"}</p>
                <p><strong>Room</strong>{selected.roomId?.roomNumber ? `Room ${selected.roomId.roomNumber}` : "—"}</p>
                <p><strong>Bed</strong>{selected.bedId?.bedNumber ? `Bed ${selected.bedId.bedNumber} (${selected.bedId.bedType})` : "—"}</p>
                <p><strong>Check-In</strong>{formatDate(selected.checkIn)}</p>
                <p><strong>Check-Out</strong>{formatDate(selected.checkOut)}</p>
                <p><strong>Status</strong><span className={`badge ${selected.status}`}>{selected.status}</span></p>
                <p><strong>Applied On</strong>{formatDate(selected.createdAt)}</p>
                {selected.specialRequests && <p className="full"><strong>Special Requests</strong>{selected.specialRequests}</p>}
              </div>
            </div>
            <div className="page-modal-footer">
              <button className="btn-action view" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
