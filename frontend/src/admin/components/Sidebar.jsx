import { Home, Building2, DoorOpen, BookOpen, Bed, FileText, ChevronRight, PersonStanding } from 'lucide-react';
import "../styles/sidebar.css";
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { icon: Home, label: 'Dashboard', to: '/super-admin/dashboard' },
    { icon: Building2, label: 'Guest House', to: '/super-admin/guesthouses' },
    { icon: DoorOpen, label: 'Room Management', to: '/super-admin/rooms' },
    { icon: Bed, label: 'Bed Management', to: '/super-admin/beds' },
    { icon: BookOpen, label: 'Booking Management', to: '/super-admin/bookings' },
    { icon: PersonStanding, label: 'List Users', to: '/super-admin/users' },
    { icon: FileText, label: 'Audit Logs', to: '/super-admin/audits' },
  ];

  return (
    <aside className="sidebar">
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
    </aside>
  );
};

export default Sidebar;
