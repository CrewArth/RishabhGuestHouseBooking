import React, { useEffect, useState, useCallback } from "react";
import "../styles/adminDashboard.css";
import BookingsPerDayChart from "../components/BookingsPerDayChart.jsx";
import TopGuestHousesChart from "../components/TopGuestHousesChart.jsx";
import Calendar from "../components/Calender.jsx";
import TodayBookings from "../components/TodayBookings";
import api from "../../utils/api";

const Overview = ({ showTodayBookings = false }) => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalUsers: 0,
    totalGuestHouses: 0,
    rejectedBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    todaysBookings: 0,
    occupancyRate: 0,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [bookingsTrend, setBookingsTrend]   = useState({ data: [], loading: false, rangeLabel: "" });
  const [topGuestHouses, setTopGuestHouses] = useState({ data: [], loading: false, rangeLabel: "" });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState({ startDate: '', endDate: '' }); // local draft before applying

  const getDefaultEnd   = () => new Date().toISOString().slice(0, 10);
  const getDefaultStart = () => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10); };

  const [dateRange, setDateRange] = useState({ startDate: getDefaultStart(), endDate: getDefaultEnd() });
  const maxDate = getDefaultEnd();

  const fmt = (range) => {
    if (!range?.startDate || !range?.endDate) return "";
    const f = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
    return `${f.format(new Date(range.startDate))} – ${f.format(new Date(range.endDate))}`;
  };

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await api.get("/api/admin/summary");
      setStats(res.data);
    } catch (err) { console.error(err); }
    finally { setRefreshing(false); }
  };

  const fetchMetrics = useCallback(async () => {
    setBookingsTrend((p) => ({ ...p, loading: true }));
    setTopGuestHouses((p) => ({ ...p, loading: true }));
    try {
      const [tR, gR] = await Promise.all([
        api.get("/api/admin/metrics/bookings-per-day",  { params: { startDate: dateRange.startDate, endDate: dateRange.endDate, status: "approved" } }),
        api.get("/api/admin/metrics/top-guest-houses",  { params: { startDate: dateRange.startDate, endDate: dateRange.endDate, limit: 5, status: "approved" } }),
      ]);
      setBookingsTrend({ data: tR.data?.data || [], loading: false, rangeLabel: fmt(tR.data?.range) });
      setTopGuestHouses({ data: gR.data?.data || [], loading: false, rangeLabel: fmt(gR.data?.range) });
    } catch (err) {
      console.error(err);
      setBookingsTrend((p) => ({ ...p, loading: false }));
      setTopGuestHouses((p) => ({ ...p, loading: false }));
    }
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchStats();
    fetchMetrics();
    const id = setInterval(() => { fetchStats(); fetchMetrics(); }, 30000);
    return () => clearInterval(id);
  }, [fetchMetrics]);

  return (
    <div className="page-root">
      <div className="page-header-row">
        {refreshing && <span className="refreshing-text">Refreshing…</span>}
      </div>

      {showTodayBookings && <TodayBookings />}

      {/* Stat cards */}
      <div className="card-grid">
        {[
          { label: "Total Bookings",  val: stats.totalBookings },
          { label: "Total Admins",    val: stats.totalUsers },
          { label: "Guest Houses",    val: stats.totalGuestHouses },
          { label: "Rejected",        val: stats.rejectedBookings,  cls: "danger" },
          { label: "Pending",         val: stats.pendingBookings,   cls: "warning" },
          { label: "Approved",        val: stats.approvedBookings,  cls: "success" },
          { label: "Occupancy Rate",  val: `${stats.occupancyRate}%` },
          { label: "Today's Bookings",val: stats.todaysBookings },
        ].map(({ label, val, cls }) => (
          <div key={label} className={`dashboard-card${cls ? ` ${cls}` : ""}`}>
            <h2 className="stat-number">{val}</h2>
            <p>{label}</p>
          </div>
        ))}
      </div>

      {/* Date range picker — button + dropdown */}
      <div className="date-range-selector">
        <button
          className="date-range-btn"
          onClick={() => { setDraft({ ...dateRange }); setPickerOpen((o) => !o); }}
        >
          📅 {dateRange.startDate} → {dateRange.endDate}
        </button>

        {pickerOpen && (
          <div className="date-range-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="date-range-dropdown-body">
              <label>
                From
                <input type="date" value={draft.startDate} max={draft.endDate}
                  onChange={(e) => setDraft((p) => ({ ...p, startDate: e.target.value }))} />
              </label>
              <label>
                To
                <input type="date" value={draft.endDate} min={draft.startDate} max={maxDate}
                  onChange={(e) => setDraft((p) => ({ ...p, endDate: e.target.value }))} />
              </label>
            </div>
            <div className="date-range-dropdown-footer">
              <button className="date-range-apply" onClick={() => { setDateRange(draft); setPickerOpen(false); }}>
                Apply
              </button>
              <button className="date-range-cancel" onClick={() => setPickerOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="metrics-grid">
        <BookingsPerDayChart
          key={`b-${dateRange.startDate}-${dateRange.endDate}`}
          data={bookingsTrend.data} loading={bookingsTrend.loading} rangeLabel={bookingsTrend.rangeLabel}
        />
        <TopGuestHousesChart
          key={`g-${dateRange.startDate}-${dateRange.endDate}`}
          data={topGuestHouses.data} loading={topGuestHouses.loading} rangeLabel={topGuestHouses.rangeLabel}
        />
      </div>

      {/* Calendar */}
      <div className="calendar-section">
        <h2 className="section-title">Booking Calendar</h2>
        <p className="section-subtitle">All approved bookings at a glance</p>
        <Calendar />
      </div>
    </div>
  );
};

export default Overview;
