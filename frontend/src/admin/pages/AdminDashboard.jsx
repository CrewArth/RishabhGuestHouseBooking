import Navbar from '../../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '../context/SidebarContext';
import "../styles/dashboard.css"



export default function AdminDashboard() {
  return (
    <SidebarProvider>
      <div className="dashboard-layout">
        <Navbar />
        <div className="layout-container">
          <Sidebar />
          <div className="main-content">
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}