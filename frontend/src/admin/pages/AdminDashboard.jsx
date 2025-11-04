import Navbar from '../../components/Navbar';
import HeroSection from '../../users/components/HeroSection';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  return (
    <div className="admin-dashboard">


      <Navbar />
      <Sidebar/>
      <MainContent />
      
    </div>
  );
}
