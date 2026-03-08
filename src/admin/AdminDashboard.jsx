// src/admin/AdminDashboard.jsx
import React, { useState } from "react";
import { FaServer, FaUsers, FaExclamationTriangle, FaCog } from "react-icons/fa";
import "./adminCSS/AdminDashboard.css";
import UserManagement from "./UserManagement.jsx"; // Import the table component

export default function AdminDashboard() {
  const [activeItem, setActiveItem] = useState("System Status");

  const menuItems = [
    { name: "System Status", icon: <FaServer /> },
    { name: "User Management", icon: <FaUsers /> },
    { name: "Logs & Alerts", icon: <FaExclamationTriangle /> },
    { name: "Settings", icon: <FaCog /> }
  ];

  const renderContent = () => {
    switch (activeItem) {
      case "System Status":
        return <p>Overview of system performance and health.</p>;
      case "User Management":
        return <UserManagement />; // ← Show the table here
      case "Logs & Alerts":
        return <p>System logs, warnings, and notifications appear here.</p>;
      case "Settings":
        return <p>Adjust system settings and preferences.</p>;
      default:
        return null;
    }
  };

  return (
    <div className="admin-container">
      {/* Left Menu */}
      <div className="admin-menu">
        {menuItems.map((item) => (
          <div
            key={item.name}
            className={`admin-menu-item ${activeItem === item.name ? "active" : ""}`}
            onClick={() => setActiveItem(item.name)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-text">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Right Content */}
      <div className="admin-content">
        <h2>{activeItem}</h2>
        {renderContent()}
      </div>
    </div>
  );
}