import React, { useEffect, useState } from "react";
import "../styles/adminDashboard.css";
import axios from "axios";
import BookingsPerDayChart from "../components/BookingsPerDayChart.jsx";
import TopGuestHousesChart from "../components/TopGuestHousesChart.jsx";
import Calendar from "../components/Calender.jsx";

const AdminDashboard = () => {
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
  const [bookingsTrend, setBookingsTrend] = useState({
    data: [],
    loading: false,
    rangeLabel: "",
  });
  const [topGuestHouses, setTopGuestHouses] = useState({
    data: [],
    loading: false,
    rangeLabel: "",
  });

  const API_BASE = "http://localhost:5000/api/admin";
  const METRICS_RANGE_DAYS = 30;

  const formatRangeLabel = (range) => {
    if (!range?.startDate || !range?.endDate) return "";
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    });

    const start = formatter.format(new Date(range.startDate));
    const end = formatter.format(new Date(range.endDate));
    return `${start} – ${end}`;
  };

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await axios.get(`${API_BASE}/summary`);
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching admin stats: ", err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      setBookingsTrend((prev) => ({ ...prev, loading: true }));
      setTopGuestHouses((prev) => ({ ...prev, loading: true }));

      const [trendRes, guestRes] = await Promise.all([
        axios.get(`${API_BASE}/metrics/bookings-per-day`, {
          params: { range: METRICS_RANGE_DAYS, status: "approved" },
        }),
        axios.get(`${API_BASE}/metrics/top-guest-houses`, {
          params: { range: METRICS_RANGE_DAYS, limit: 5, status: "approved" },
        }),
      ]);

      setBookingsTrend({
        data: trendRes.data?.data || [],
        loading: false,
        rangeLabel: formatRangeLabel(trendRes.data?.range),
      });

      setTopGuestHouses({
        data: guestRes.data?.data || [],
        loading: false,
        rangeLabel: formatRangeLabel(guestRes.data?.range),
      });
    } catch (error) {
      console.error("Error fetching admin metrics: ", error);
      setBookingsTrend((prev) => ({ ...prev, loading: false }));
      setTopGuestHouses((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchStats(); 
    fetchMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">Admin Dashboard</h1>

      {refreshing && (
        <p style={{ fontSize: "14px", color: "gray" }}>Refreshing…</p>
      )}

      <div className="card-grid">
        <div className="dashboard-card">
          <h2 className="stat-number">{stats.totalBookings}</h2>
          <p>Total Bookings</p>
        </div>

        <div className="dashboard-card">
          <h2 className="stat-number">{stats.totalUsers}</h2>
          <p>Total Users</p>
        </div>

        <div className="dashboard-card">
          <h2 className="stat-number">{stats.totalGuestHouses}</h2>
          <p>Total Guest Houses</p>
        </div>

        <div className="dashboard-card danger">
          <h2 className="stat-number">{stats.rejectedBookings}</h2>
          <p>Rejected Bookings</p>
        </div>

        <div className="dashboard-card warning">
          <h2 className="stat-number">{stats.pendingBookings}</h2>
          <p>Pending Bookings</p>
        </div>

        <div className="dashboard-card success">
          <h2 className="stat-number">{stats.approvedBookings}</h2>
          <p>Approved Bookings</p>
        </div>

        <div className="dashboard-card">
          <h2 className="stat-number">{stats.occupancyRate}%</h2>
          <p>Occupancy Rate</p>
        </div>

        <div className="dashboard-card">
          <h2 className="stat-number">{stats.todaysBookings}</h2>
          <p>Today's Booking</p>
        </div>
      </div>

   <div className="metrics-grid">
        <BookingsPerDayChart
          data={bookingsTrend.data}
          loading={bookingsTrend.loading}
          rangeLabel={bookingsTrend.rangeLabel}
        />
        <TopGuestHousesChart
          data={topGuestHouses.data}
          loading={topGuestHouses.loading}
          rangeLabel={topGuestHouses.rangeLabel}
        />
      </div> 

      {/* Calendar Section */}
       <div className="calendar-section">
        <h2 className="section-title">Booking Calendar</h2>
        <p className="section-subtitle">View all approved bookings on the calendar</p>
        <Calendar />
      </div> 
    </div>
  );
};

export default AdminDashboard;
