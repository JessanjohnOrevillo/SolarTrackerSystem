// src/admin/SystemStatusCards.jsx
import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { app } from "../firebase/config.js";
import "./adminCSS/SystemStatusCards.css";

const db = getFirestore(app);

export default function SystemStatusCards() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [systemData, setSystemData] = useState({
    battery: 0,
    solarCharging: false,
    bulbOn: false,
    wifiConnected: false,
    voltage: 0,
    solarInput: 0,
    temperature: 0
  });

  // Fetch users from Firestore
  const fetchUsers = async () => {
    try {
      const usersCol = collection(db, "users");
      const usersSnapshot = await getDocs(usersCol);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Open modal for user
  const openModal = (user) => {
    setSelectedUser(user);
    setSystemData({
      battery: user.systemData?.battery || 0,
      solarCharging: user.systemData?.solarCharging || false,
      bulbOn: user.systemData?.bulbOn || false,
      wifiConnected: user.systemData?.wifiConnected || false,
      voltage: user.systemData?.voltage || 0,
      solarInput: user.systemData?.solarInput || 0,
      temperature: user.systemData?.temperature || 0
    });
    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  // Toggle system fields and update Firestore
  const toggleField = async (field) => {
    const newValue = !systemData[field];
    setSystemData(prev => ({ ...prev, [field]: newValue }));

    if (selectedUser) {
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, { [`systemData.${field}`]: newValue });
    }
  };

  return (
    <div className="system-status-container">
      <h3 className="gradient-text">Users System Status</h3>

      <div className="user-cards">
        {users.map(user => (
          <div
            key={user.id}
            className="user-card"
            onClick={() => openModal(user)}
          >
            <h4 className="gradient-text">{user.firstName} {user.lastName}</h4>
            <p className="gradient-text">{user.email}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="gradient-text">{selectedUser.firstName} {selectedUser.lastName}</h2>
            <div className="user-info">
              <p><span className="label">Email:</span> {selectedUser.email}</p>
              <p><span className="label">Contact:</span> {selectedUser.contact}</p>
              <p><span className="label">Address:</span> {selectedUser.address}</p>
            </div>

            <h4 className="modal-subtitle gradient-text">System Status</h4>
            <div className="status-grid">
              <p><span className="label">Battery:</span> <span className="gradient-text">{systemData.battery}%</span></p>
              <p><span className="label">Voltage:</span> <span className="gradient-text">{systemData.voltage} V</span></p>
              <p><span className="label">Solar Input:</span> <span className="gradient-text">{systemData.solarInput} V</span></p>
              <p><span className="label">Temperature:</span> <span className="gradient-text">{systemData.temperature} °C</span></p>
            </div>

            <div className="control-row">
              <label className="toggle-label">
                <input type="checkbox" checked={systemData.solarCharging} onChange={() => toggleField("solarCharging")} />
                <span className="slider"></span>
                Solar Charging
              </label>

              <label className="toggle-label">
                <input type="checkbox" checked={systemData.bulbOn} onChange={() => toggleField("bulbOn")} />
                <span className="slider"></span>
                Bulb
              </label>

              <label className="toggle-label">
                <input type="checkbox" checked={systemData.wifiConnected} onChange={() => toggleField("wifiConnected")} />
                <span className="slider"></span>
                Wi-Fi
              </label>
            </div>

            <button className="close-btn" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}