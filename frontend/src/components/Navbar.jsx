import React, { useEffect, useState } from "react";
import "../styles/navbar.css";
import Logo from "./Logo";
import { useNavigate, Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";  // For mobile hamburger icon

const Navbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUsername(user.firstName);
      setIsLoggedIn(true);
      return;
    }

    if (token) {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      setUsername(decoded.firstName || decoded.name || decoded.email || "");
      setIsLoggedIn(true);
    }
  }, []);

  const handleAuth = () => {
    if (isLoggedIn) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsLoggedIn(false);
      setUsername("");
      navigate("/");
      return;
    }
    navigate("/signin");
  };

  return (
    <nav className="navbar-container">
      <div className="navbar-left">
        <Logo />
        <p className="navbar-title">Rishabh Guest House</p>
      </div>

      {/* Hamburger Icon for Mobile */}
      <div className="mobile-menu-icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        <FaBars />
      </div>

      {/* Right-side Desktop Nav */}
      <div className={`navbar-middle ${isMobileMenuOpen ? "active" : ""}`}>
        {isLoggedIn && (
          <>
            {JSON.parse(localStorage.getItem("user"))?.role !== "admin" && (
              <Link to="/my-bookings" className="nav-link">My Bookings</Link>
            )}
            <Link to="/profile" className="nav-link">Profile</Link>
          </>
        )}
      </div>

      <div className={`navbar-authentication ${isMobileMenuOpen ? "active" : ""}`}>
        {isLoggedIn && <span className="welcome-text">Welcome, <strong>{username}</strong>!</span>}

        <button className="authButton" onClick={handleAuth}>
          {isLoggedIn ? "Logout" : "Signin"}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
