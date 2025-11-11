import React, { useEffect, useState } from 'react';
import '../styles/adminDashboard.css';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalUsers: 0,
    totalGuestHouses: 0,
    rejectedBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    todaysBookings: 0
  });

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/summary');
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching admin stats: ", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">Admin Dashboard</h1>

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
