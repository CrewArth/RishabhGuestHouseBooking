import Navbar from '../../components/Navbar';
import Overview from './Overview';
import '../../styles/navbar.css';

/**
 * ADMIN (non-super-admin) user dashboard.
 * This page is NOT inside the AdminDashboard shell (no sidebar),
 * so it brings its own Navbar and renders Overview with the
 * TodayBookings widget enabled.
 */
export default function AdminUserDashboard() {
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <Navbar />
      {/* Push content below the fixed 70px navbar */}
      <div style={{ paddingTop: '70px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
          <Overview showTodayBookings />
        </div>
      </div>
    </div>
  );
}
