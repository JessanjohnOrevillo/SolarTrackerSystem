import React from "react";
import "./adminCSS/UserDetailModal.css";

export default function UserDetailModal({ user, systemData, onClose }) {
  if (!user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{user.firstName} {user.lastName}</h2>
        <p>Email: {user.email}</p>
        <p>Contact: {user.contact}</p>
        <p>Address: {user.address}</p>
        <p>Role: {user.role}</p>
        <h3>System Status</h3>
        <p>Battery: {systemData.battery}%</p>
        <p>Charging: {systemData.solarCharging ? "ON" : "OFF"}</p>
        <p>Bulb: {systemData.bulbOn ? "ON" : "OFF"}</p>
        <p>Wi-Fi: {systemData.wifiConnected ? "Connected" : "Disconnected"}</p>
        <p>Voltage: {systemData.voltage} V</p>
        <p>Solar Input: {systemData.solarInput} V</p>
        <p>Temperature: {systemData.temperature}°C</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}