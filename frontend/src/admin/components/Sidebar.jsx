import { Home, Building2, DoorOpen, Bed, FileText, ChevronRight, Settings, LogOut, House } from 'lucide-react';
import "../styles/sidebar.css";
import { NavLink } from 'react-router-dom';


// const Sidebar = () => {
//     const menuItems = [
//         { icon: Home, label: 'Dashboard', active: true },
//         { icon: House, label: 'Booking Management' },
//         { icon: Building2, label: 'Guest House' },
//         { icon: DoorOpen, label: 'Room Management' },
//         { icon: Bed, label: 'Bed Management' },
//         { icon: FileText, label: 'Audit Logs' },
//     ];

//     const bottomMenuItems = [
//         { icon: Settings, label: 'Settings' },
//         { icon: LogOut, label: 'Logout' },
//     ];

//     return (
//         <div className="sidebar">
            
//             <nav className="sidebar-nav">
//                 <ul className="nav-list">
//                     {menuItems.map((item, index) => (
//                         <li key={index} className={`nav-item ${item.active ? 'active' : ''}`}>
//                             <item.icon size={20} />
//                             <span>{item.label}</span>
//                             <ChevronRight size={16} className="arrow-icon" />
//                         </li>
//                     ))}
//                 </ul>
//             </nav>

            
//         </div>
//     );
// }

// export default Sidebar;


const Sidebar = () => {
  const menuItems = [
    { icon: Home, label: 'Dashboard', route: '/admin/dashboard' },
    { icon: Building2, label: 'Guest House', route: '/admin/guesthouse' },
    { icon: FileText, label: 'Booking Management', route: '/admin/bookings' },
    { icon: DoorOpen, label: 'Room Management', route: '/admin/rooms' },
    { icon: Bed, label: 'Bed Management', route: '/admin/beds' },
    { icon: FileText, label: 'Audit Logs', route: '/admin/audits' },
  ];

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item, index) => (
            <li key={index} className="nav-item">
              <NavLink 
                to={item.route}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                <ChevronRight size={16} className="arrow-icon" />
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Bottom Section */}
        <ul className="nav-list bottom-nav">
          {/* {bottomMenuItems.map((item, index) => (
            <li key={index} className="nav-item">
              <NavLink 
                to={item.route}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))} */}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
