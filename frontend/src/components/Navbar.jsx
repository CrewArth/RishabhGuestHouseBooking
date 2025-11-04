import React, { useEffect, useState } from "react";
import "../styles/navbar.css";
import Logo from "./Logo";
import { useNavigate, Link } from "react-router-dom";


const Navbar = () => {
  const navigate = useNavigate();

  // Initialize state conservatively; real value will be set in useEffect
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  // Determine auth status on mount and when storage changes
  useEffect(() => {
    const updateAuthFromStorage = () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUsername(user.firstName)
        } catch (e) {
          setUsername("");
        }
        setIsLoggedIn(true);
        return;
      }

      if (token) {
        // Try decoding JWT payload to extract a username (if backend includes it)
        try {
          const payload = token.split(".")[1];
          const decoded = JSON.parse(atob(payload));
          setUsername(decoded.firstName || decoded.name || decoded.email || "");
        } catch (e) {
          setUsername("");
        }
        setIsLoggedIn(true);
        return;
      }

      setIsLoggedIn(false);
      setUsername("");
    };

    updateAuthFromStorage();

    // keep UI in sync when localStorage changes in other tabs
    const onStorage = (e) => {
      if (e.key === "token" || e.key === "user") updateAuthFromStorage();
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleAuth = () => {
    if (isLoggedIn) {
      // Logout
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsLoggedIn(false);
      setUsername("");
      navigate("/");
      // return;
    }

    // Not logged in -> go to sign in page
    navigate("/signin");
  };

  return (
    <nav className="navbar-container">
      <div className="navbar-left">
        <div className="navbar-logo">
          <Logo />
        </div>
        <p className="navbar-title">Rishabh Guest House</p>
      </div>  

      <div className="navbar-links">
  {isLoggedIn ? (
    <>
      <Link
        to="/my-bookings"
        className="nav-links"
        style={{
          color: "#1f2937",
          fontSize: "0.9rem",
          fontWeight: "500",
          textDecoration: "none",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
        onMouseLeave={(e) => (e.target.style.color = "#1f2937")}
      >
        My Bookings
      </Link>
      <Link
        to="/profile"
        className="nav-links"
        style={{
          color: "#1f2937",
          fontSize: "0.9rem",
          fontWeight: "500",
          textDecoration: "none",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
        onMouseLeave={(e) => (e.target.style.color = "#1f2937")}
      >
        Profile
      </Link>
    </>
  ) : null}
</div>


      <div className="navbar-authentication">
        {isLoggedIn && <span className="welcome-text">Welcome {username}!</span>}
        <button className="authButton" onClick={handleAuth}>
          {isLoggedIn ? "Logout" : "Signin"}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
