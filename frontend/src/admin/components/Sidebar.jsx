import "../styles/sidebar.css";
import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { mainSidebarData } from '../utils/sidebarData';

// Settings is always the last item — split it out for a visual divider
const SETTINGS_ID = 'MC_SETTINGS';

const Sidebar = () => {
  const navItems = mainSidebarData.filter((item) => item.id !== SETTINGS_ID);
  const settingsItem = mainSidebarData.find((item) => item.id === SETTINGS_ID);

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

        {/* Settings pinned at the bottom with a divider */}
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
