import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../utils/api";
import editIcon from "../../assets/edit.svg";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN");
};

const GuestHouseBookings = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth?.user);
  const assignedGuestHouse = currentUser?.assignedGuestHouseId;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    status: "all",
    startDate: "",
    endDate: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const getGuestHouseId = () => {
    if (!assignedGuestHouse) return null;
    return typeof assignedGuestHouse === "object"
      ? assignedGuestHouse.guestHouseId
      : assignedGuestHouse;
  };

  const fetchBookings = async (page = 1, silent = false) => {
    try {
      !silent ? setLoading(true) : setRefreshing(true);
      setError("");

      const params = {
        page,
        limit,
        ...(getGuestHouseId() && { guestHouseId: getGuestHouseId() }),
        ...(appliedFilters.status !== "all" && { status: appliedFilters.status }),
        ...(appliedFilters.startDate && { startDate: appliedFilters.startDate }),
        ...(appliedFilters.endDate && { endDate: appliedFilters.endDate }),
      };

      const res = await api.get("/api/bookings", { params });
      setBookings(Array.isArray(res.data?.bookings) ? res.data.bookings : []);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || 1);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error("Error fetching guest house bookings:", err);
      setError("Failed to load bookings");
      setBookings([]);
      toast.error("Failed to load bookings");
    } finally {
      !silent ? setLoading(false) : setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings(currentPage);
  }, [currentPage, appliedFilters]);

  const applyFilter = () => {
    setCurrentPage(1);
    setAppliedFilters({
      status: statusFilter,
      startDate,
      endDate,
    });
  };

  const resetFilter = () => {
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    setAppliedFilters({
      status: "all",
      startDate: "",
      endDate: "",
    });
  };

  const handleRefresh = () => fetchBookings(currentPage, true);

  const guestHouseName =
    typeof assignedGuestHouse === "object"
      ? assignedGuestHouse.guestHouseName
      : "My Guest House";

  if (loading) return <div className="page-root"><p style={{ color: "#64748b" }}>Loading bookings…</p></div>;
  if (error && !refreshing) return <div className="page-root"><p style={{ color: "#dc2626" }}>{error}</p></div>;

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Guest House Bookings</h1>
          <p className="page-subtitle">
            All bookings for <strong>{guestHouseName}</strong>
            {totalCount > 0 && <span style={{ marginLeft: 8, color: "#64748b" }}>({totalCount} total)</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn-action view" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="toolbar-row">
        <span className="toolbar-label">Status:</span>
        <select
          className="toolbar-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <span className="toolbar-label" style={{ marginLeft: 16 }}>From:</span>
        <input
          type="date"
          className="toolbar-select"
          style={{ padding: "6px 10px" }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <span className="toolbar-label">To:</span>
        <input
          type="date"
          className="toolbar-select"
          style={{ padding: "6px 10px" }}
          value={endDate}
          min={startDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button className="btn-action view" onClick={applyFilter}>Apply</button>
        <button className="btn-action reject" onClick={resetFilter}>Reset</button>
      </div>

      {/* Table */}
      <div className="table-scroll">
        <table className="data-table" style={{ minWidth: 1000 }}>
          <thead>
            <tr>
              <th className="center">#</th>
              <th>Guest</th>
              <th>Phone</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Room / Bed</th>
              <th>Status</th>
              <th>Booked On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr><td colSpan="9" className="table-empty">No bookings found</td></tr>
            ) : (
              bookings.map((b, i) => {
                const index = (currentPage - 1) * limit + i + 1;
                return (
                  <tr key={b._id}>
                    <td className="center">{index}</td>
                    <td>
                      {b.userId?.firstName || b.fullName || "—"}
                      {b.userId?.lastName ? ` ${b.userId.lastName}` : ""}
                      <br />
                      {b.userId?.email && (
                        <span style={{ color: "#64748b", fontSize: "0.8rem" }}>{b.userId.email}</span>
                      )}
                    </td>
                    <td>{b.userId?.phone || b.phone || "—"}</td>
                    <td>{formatDate(b.checkIn)}</td>
                    <td>{formatDate(b.checkOut)}</td>
                    <td>
                      {b.roomId?.roomNumber ? `Room ${b.roomId.roomNumber}` : "—"}
                      {b.bedId?.bedNumber ? ` / Bed ${b.bedId.bedNumber}` : ""}
                      {b.bedId?.bedType ? ` (${b.bedId.bedType})` : ""}
                    </td>
                    <td><span className={`badge ${b.status}`}>{b.status}</span></td>
                    <td>{formatDate(b.createdAt)}</td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="btn-action edit"
                          onClick={() => navigate("/admin/book-room", { state: { bookingId: b._id } })}
                          title="Edit booking"
                          style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: '4px' }}
                        >
                          <img src={editIcon} alt="Edit" style={{ width: 16, height: 16 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="pagination-row">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
            <span style={{ marginLeft: 16, color: "#64748b" }}>
              Showing {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, totalCount)} of {totalCount}
            </span>
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default GuestHouseBookings;
