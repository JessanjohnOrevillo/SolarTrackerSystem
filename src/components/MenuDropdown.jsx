import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/MenuDropdown.css";
import { getAuth, signOut } from "firebase/auth";

export default function MenuDropdown({ isLoggedIn, setIsLoggedIn }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  // 🔥 NEW: reference for detecting outside click
  const menuRef = useRef();

  // 🔥 NEW: close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setIsLoggedIn(false);
        setOpen(false);
        navigate("/login");
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  return (
    <div className="menu-dropdown" ref={menuRef}>
      <button className="menu-button" onClick={() => setOpen(!open)}>
        ☰
      </button>

      {open && (
        <div className="menu-content">
          <Link to="/about" className="menu-item" onClick={() => setOpen(false)}>
            About Us
          </Link>

          {!isLoggedIn && (
            <>
              <Link to="/login" className="menu-item" onClick={() => setOpen(false)}>
                Log In
              </Link>
              <Link to="/register" className="menu-item" onClick={() => setOpen(false)}>
                Register
              </Link>
            </>
          )}

          {isLoggedIn && (
            <button className="menu-item logout-button" onClick={handleLogout}>
              Log Out
            </button>
          )}
        </div>
      )}
    </div>
  );
}