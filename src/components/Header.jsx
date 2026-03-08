// Header.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import MenuDropdown from "./MenuDropdown.jsx";
import "../styles/Header.css";
import { FaSun } from "react-icons/fa";

export default function Header({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (isLoggedIn) navigate("/"); // go to welcome page if logged in
    else navigate("/login");        // go to login if not
  };

  return (
    <header className="header">
      <div className="header-left">
        <FaSun className="header-logo" onClick={handleLogoClick} />
        <h1 className="header-title">Solar Tracker System</h1>
      </div>

      <MenuDropdown isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
    </header>
  );
}