import React from 'react'
import { Home, Building2, DoorOpen, Bed, FileText, ChevronRight, Settings, LogOut } from 'lucide-react';
import "../styles/sidebar.css";

const Sidebar = () => {
    const menuItems = [
        { icon: Home, label: 'Dashboard', active: true },
        { icon: Building2, label: 'Guest House' },
        { icon: DoorOpen, label: 'Room Management' },
        { icon: Bed, label: 'Bed Management' },
        { icon: FileText, label: 'Audit Logs' },
    ];

    const bottomMenuItems = [
        { icon: Settings, label: 'Settings' },
        { icon: LogOut, label: 'Logout' },
    ];

    return (
        <div className="sidebar">
            
            <nav className="sidebar-nav">
                <ul className="nav-list">
                    {menuItems.map((item, index) => (
                        <li key={index} className={`nav-item ${item.active ? 'active' : ''}`}>
                            <item.icon size={20} />
                            <span>{item.label}</span>
                            <ChevronRight size={16} className="arrow-icon" />
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <ul className="nav-list">
                    {bottomMenuItems.map((item, index) => (
                        <li key={`bottom-${index}`} className="nav-item">
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default Sidebar;
