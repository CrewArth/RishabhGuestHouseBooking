import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import "../styles/navbar.css";
import Logo from "./Logo";
import { useNavigate, Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { normalizeRole } from "../utils/auth";
import { logout } from "../redux/authSlice";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const siteName = useSelector((state) => state.siteSettings.siteName);
  const user = useSelector((state) => state.auth.user);
  const isLoggedIn = !!user;

  const handleAuth = () => {
    if (isLoggedIn) {
      dispatch(logout());
      navigate("/signin");
      return;
    }
    navigate("/signin");
  };

  return (
    <nav className="navbar-container">
      <div className="navbar-left">
        <Logo />
        <p className="navbar-title">{siteName}</p>
      </div>

      {/* Hamburger Icon for Mobile */}
      <div className="mobile-menu-icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        <FaBars />
      </div>

      {/* Right-side Desktop Nav */}
      <div className={`navbar-middle ${isMobileMenuOpen ? "active" : ""}`}>
        {isLoggedIn && (
          <>
            {normalizeRole(user?.role) === "ADMIN" && (
              <>
                <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/admin/book-room" className="nav-link">Book Room</Link>
              </>
            )}
          </>
        )}
      </div>

      <div className={`navbar-authentication ${isMobileMenuOpen ? "active" : ""}`}>
        {isLoggedIn && <span className="welcome-text">Welcome, <strong>{user?.firstName}</strong>!</span>}

        <button className="authButton" onClick={handleAuth}>
          {isLoggedIn ? "Logout" : "Signin"}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
