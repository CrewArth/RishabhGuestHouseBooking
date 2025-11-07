import { Home, Building2, DoorOpen, BookOpen, Bed, FileText, ChevronRight } from 'lucide-react';
import "../styles/sidebar.css";
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { icon: Home, label: 'Dashboard', to: '/admin/dashboard' },
    { icon: Building2, label: 'Guest House', to: '/admin/guesthouses' },
    { icon: DoorOpen, label: 'Room Management', to: '/admin/rooms' },
    { icon: Bed, label: 'Bed Management', to: '/admin/beds' },
    { icon: BookOpen, label: 'Booking Management', to: '/admin/bookings' },
    { icon: FileText, label: 'List Users', to: '/admin/users' },

    { icon: FileText, label: 'Audit Logs', to: '/admin/audits' },
  ];

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item, index) => (
            <li key={index} className="nav-item">
              <NavLink
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                <ChevronRight size={16} className="arrow-icon" />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
