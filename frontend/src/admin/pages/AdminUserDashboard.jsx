import Navbar from '../../components/Navbar';
import Overview from './Overview';

export default function AdminUserDashboard() {
  return (
    <>
      <Navbar />
      <Overview showTodayBookings />
    </>
  );
}
