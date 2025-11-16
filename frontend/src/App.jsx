import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignupPage from './users/pages/Signup';
import LoginPage from './users/pages/Login';
import Homepage from './users/pages/Homepage';
import ProtectedRoute from './users/routes/ProtectedRoute';
import Dashboard from './users/pages/Dashboard';
import ProtectedAdminRoute from './admin/routes/ProtectedAdminRoute';
import AdminDashboard from './admin/pages/AdminDashboard';
import BookingForm from './users/pages/BookingForm';
import MyBookings from './users/pages/MyBookings';
import Profile from './users/pages/Profile';
import AddRooms from './admin/pages/RoomManagement.jsx';
import AddBeds from './admin/pages/BedManagement.jsx';
import AuditLogs from './admin/pages/AuditLogs';
import Overview from './admin/pages/Overview';
import Bookings from './admin/pages/Bookings';
import GuestHouseManagement from './admin/pages/GuestHouseManagement.jsx';
import UsersList from './admin/pages/UsersList';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function App() {
  return (

    <>
    <ToastContainer position="top-right" autoClose={2500} />
    
    <BrowserRouter>
      <Routes>
        
        {/* ------------------ PUBLIC ROUTES ------------------ */}
        <Route path="/" element={<Homepage />} />
        <Route path="/signin" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* ------------------ USER PROTECTED ROUTES ------------------ */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/booking" 
          element={
            <ProtectedRoute>
              <BookingForm />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/my-bookings" 
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* ------------------ ADMIN PANEL ROUTES ------------------ */}
        <Route 
          element={
            <ProtectedAdminRoute>
              <AdminDashboard /> {/* Layout wrapper */}
            </ProtectedAdminRoute>
          }
        >
          <Route path="/admin/users" element={<UsersList />} />
          <Route path="/admin/dashboard" element={<Overview />} />
          <Route path="/admin/guesthouses" element={<GuestHouseManagement />} />
          <Route path="/admin/rooms" element={<AddRooms />} />
          <Route path="/admin/beds" element={<AddBeds />} />
          <Route path="/admin/audits" element={<AuditLogs />} />
          <Route path="/admin/bookings" element={<Bookings />}/>
        </Route>  

      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
