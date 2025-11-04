import { useState } from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import SignupPage from './users/pages/Signup'
import LoginPage from './users/pages/Login'
import Homepage from './users/pages/Homepage'
import ProtectedRoute from './users/routes/ProtectedRoute'
import Dashboard from './users/pages/Dashboard'
import ProtectedAdminRoute from './users/routes/ProtectedRoute'
import AdminDashboard from './admin/pages/AdminDashboard'
import BookingForm from './users/pages/BookingForm'
import MyBookings from './users/pages/MyBookings'
import Profile from './users/pages/Profile'

function App() {
  return (
<>
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/signin" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Booking Form Route */}
        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <BookingForm />
            </ProtectedRoute>
          }
        />

        {/* User's Booking History*/}
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* User's Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />        

        <Route
          path='/admin/dashboard'
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        ></Route>
      </Routes>
    </BrowserRouter>

</> 
  )
}

export default App
