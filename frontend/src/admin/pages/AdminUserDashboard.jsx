import Overview from './Overview';

/**
 * ADMIN (non-super-admin) user dashboard.
 * Renders Overview inside the unified AdminDashboard sidebar shell.
 */
export default function AdminUserDashboard() {
  return <Overview showTodayBookings />;
}
