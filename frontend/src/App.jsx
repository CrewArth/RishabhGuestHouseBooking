import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import lazyLoad from './utils/lazyLoad';
import ProtectedRoute from './users/routes/ProtectedRoute';
import ProtectedAdminRoute from './admin/routes/ProtectedAdminRoute';
const LoginPage = lazyLoad(() => import('./users/pages/Login'));
const AdminDashboard = lazyLoad(() => import('./admin/pages/AdminDashboard'));
const AdminUserDashboard = lazyLoad(() => import('./admin/pages/AdminUserDashboard'));
const AdminRoomBooking = lazyLoad(() => import('./admin/pages/AdminRoomBooking'));
const Profile = lazyLoad(() => import('./users/pages/Profile'));
const AddRooms = lazyLoad(() => import('./admin/pages/RoomManagement.jsx'));
const AddBeds = lazyLoad(() => import('./admin/pages/BedManagement.jsx'));
const AuditLogs = lazyLoad(() => import('./admin/pages/AuditLogs'));
const Overview = lazyLoad(() => import('./admin/pages/Overview'));
const Bookings = lazyLoad(() => import('./admin/pages/Bookings'));
const GuestHouseManagement = lazyLoad(() => import('./admin/pages/GuestHouseManagement.jsx'));
const UsersList = lazyLoad(() => import('./admin/pages/UsersList'));
const NotFound = lazyLoad(() => import('./components/NotFound'));
const ForgotPassword = lazyLoad(() => import('./users/pages/ForgotPassword'));
const ResetPassword = lazyLoad(() => import('./users/pages/ResetPassword'));
const AboutUs = lazyLoad(() => import('./commonPages/AboutUs'));
const ContactUs = lazyLoad(() => import('./commonPages/ContactUs'));
const TermsAndPolicy = lazyLoad(() => import('./commonPages/TermsAndPolicy'));
const FAQ = lazyLoad(() => import('./commonPages/FAQ'));
import ScrollToTop from './components/ScrollToTop';
import { Navigate } from 'react-router-dom';
import { getAuthenticatedRedirectPath } from './utils/auth';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function App() {
  const RootRedirect = () => {
    const redirectPath = getAuthenticatedRedirectPath();

    if (redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }

    return <LoginPage />;
  };

  return (

    <>
    <ToastContainer position="top-right" autoClose={2500} />
    
    <BrowserRouter>
      <ScrollToTop />
      <Suspense
        fallback={
          <div
            style={{
              minHeight: '100vh',
              display: 'grid',
              placeItems: 'center',
              fontSize: '1rem',
              color: '#334155',
            }}
          >
            Loading...
          </div>
        }
      >
        <Routes>
        
        {/* ------------------ PUBLIC ROUTES ------------------ */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/signin" element={<LoginPage />} />
        <Route path="/signup" element={<Navigate to="/signin" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/terms" element={<TermsAndPolicy />} />
        <Route path="/faq" element={<FAQ />} />

        {/* ------------------ USER PROTECTED ROUTES ------------------ */}
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminUserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/book-room"
          element={
            <ProtectedRoute>
              <AdminRoomBooking />
            </ProtectedRoute>
          }
        />
        <Route path="/booking" element={<Navigate to="/admin/book-room" replace />} />
        <Route path="/my-bookings" element={<Navigate to="/admin/dashboard" replace />} />
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
          <Route path="/super-admin/users" element={<UsersList />} />
          <Route path="/super-admin/dashboard" element={<Overview />} />
          <Route path="/super-admin/guesthouses" element={<GuestHouseManagement />} />
          <Route path="/super-admin/rooms" element={<AddRooms />} />
          <Route path="/super-admin/beds" element={<AddBeds />} />
          <Route path="/super-admin/audits" element={<AuditLogs />} />
          <Route path="/super-admin/bookings" element={<Bookings />}/>
        </Route>  

        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </>
  );
}

export default App;
