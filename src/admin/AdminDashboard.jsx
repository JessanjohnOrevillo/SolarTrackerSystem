import React, { useState } from "react";
import { FaServer, FaUsers, FaExclamationTriangle, FaCog } from "react-icons/fa";
import "./adminCSS/AdminDashboard.css";
import UserManagement from "./UserManagement.jsx";
import SystemStatusCards from "./SystemStatusCards.jsx";
import LogsAlerts from "./LogsAlerts.jsx"; // ← import new component

export default function AdminDashboard() {
  const [activeItem, setActiveItem] = useState("System Status");

  const menuItems = [
    { name: "System Status", icon: <FaServer /> },
    { name: "User Management", icon: <FaUsers /> },
    { name: "Logs & Alerts", icon: <FaExclamationTriangle /> },
   
  ];

  const renderContent = () => {
    switch (activeItem) {
      case "System Status":
        return <SystemStatusCards />;
      case "User Management":
        return <UserManagement />;
      case "Logs & Alerts":
        return <LogsAlerts />; // ← display logs and alerts
     
      default:
        return null;
    }
  };

  return (
    <div className="admin-container">
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

      <div className="admin-content">
        <h2>{activeItem}</h2>
        {renderContent()}
      </div>
    </div>
  );
}