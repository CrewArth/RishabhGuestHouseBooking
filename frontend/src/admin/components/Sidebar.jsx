import "../styles/sidebar.css";
import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { superAdminSidebarData, adminSidebarData } from '../utils/sidebarData';

const SETTINGS_ID = 'MC_SETTINGS';

const Sidebar = () => {
  const user = useSelector((state) => state.auth.user);
  const role = String(user?.role || '').toUpperCase();

  const sidebarDataset = role === 'ADMIN' ? adminSidebarData : superAdminSidebarData;

  const navItems = sidebarDataset.filter((item) => item.id !== SETTINGS_ID);
  const settingsItem = sidebarDataset.find((item) => item.id === SETTINGS_ID);

  const renderLink = (item) => (
    <li key={item.id} className="nav-item">
      <NavLink
        to={item.navigate}
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        <item.icon size={20} />
        <span>{item.name}</span>
        <ChevronRight size={16} className="arrow-icon" />
      </NavLink>
    </li>
  );

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {/* Main navigation items */}
        <ul className="nav-list">
          {navItems.map(renderLink)}
        </ul>

        {/* Settings pinned at the bottom with a divider (if present) */}
        {settingsItem && (
          <>
            <div className="sidebar-divider" />
            <ul className="nav-list">
              {renderLink(settingsItem)}
            </ul>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
