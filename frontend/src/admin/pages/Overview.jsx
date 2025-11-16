import React, { useEffect, useState } from "react";
import "../styles/adminDashboard.css";
import axios from "axios";

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

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await axios.get("http://localhost:5000/api/admin/summary");
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching admin stats: ", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

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
    </div>
  );
};

export default AdminDashboard;
