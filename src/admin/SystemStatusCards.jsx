import React, { useState, useEffect } from "react";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { getAuth } from "firebase/auth";
import { app } from "../firebase/config.js";
import "./adminCSS/SystemStatusCards.css";

const firestore = getFirestore(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);

export default function SystemStatusCards() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rtdbDevices, setRtdbDevices] = useState({});
  const [systemData, setSystemData] = useState({
    battery: 0,
    solarCharging: false,
    bulbOn: false,
    wifiConnected: false,
    voltage: 0,
    solarInput: 0,
    temperature: 0
  });

  // Fetch users from Firestore (real-time)
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(firestore, "users"), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    });
    return () => unsubUsers();
  }, []);

  // Listen to Realtime Database for all devices (real-time)
  useEffect(() => {
    const devicesRef = ref(rtdb, 'devices');
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRtdbDevices(data);
      }
    });
    return () => unsubscribe();
  }, []);

  // Update modal data when selected user or devices change
  useEffect(() => {
    if (selectedUser && selectedUser.deviceId && rtdbDevices[selectedUser.deviceId]) {
      const deviceData = rtdbDevices[selectedUser.deviceId];
      setSystemData({
        battery: deviceData.battery || 0,
        solarCharging: deviceData.solarCharging || false,
        bulbOn: deviceData.bulbOn || false,
        wifiConnected: deviceData.online || false,
        voltage: deviceData.voltage || 0,
        solarInput: deviceData.solarInput || 0,
        temperature: deviceData.temperature || 0
      });
    } else if (selectedUser) {
      // Device offline or not found
      setSystemData(prev => ({
        ...prev,
        wifiConnected: false
      }));
    }
  }, [selectedUser, rtdbDevices]);

  const openModal = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const getUserDevice = (user) => {
    return user.deviceId && rtdbDevices[user.deviceId]?.online === true;
  };

  // Toggle field - Update Realtime Database instantly
  const toggleField = async (field) => {
    if (!selectedUser || !selectedUser.deviceId) return;
    
    const newValue = !systemData[field];
    setSystemData(prev => ({ ...prev, [field]: newValue }));
    
    // Update Realtime Database
    const deviceRef = ref(rtdb, `devices/${selectedUser.deviceId}/${field}`);
    await set(deviceRef, newValue);
    
    console.log(`✅ ${field} toggled to ${newValue} for device ${selectedUser.deviceId}`);
  };

  return (
    <div className="system-status-container">
      <h3 className="gradient-text">Users System Status</h3>

      <div className="user-cards">
        {users.map(user => {
          const isOnline = getUserDevice(user);
          return (
            <div key={user.id} className="user-card-wrapper">
              <div
              className={`user-card ${isOnline ? "online" : "offline"}`}
              onClick={() => openModal(user)}
            >
              <h4 className="gradient-text">{user.firstName} {user.lastName}</h4>
            </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="gradient-text">{selectedUser.firstName} {selectedUser.lastName}</h2>
              <div className={`modal-status-badge ${getUserDevice(selectedUser) ? "online-badge" : "offline-badge"}`}>
                {getUserDevice(selectedUser) ? "ONLINE" : "OFFLINE"}
              </div>
            </div>
            
            <div className="user-info">
              <p><span className="label">Email:</span> {selectedUser.email}</p>
              <p><span className="label">Contact:</span> {selectedUser.contact}</p>
              <p><span className="label">Address:</span> {selectedUser.address}</p>
              <p><span className="label">Device ID:</span> {selectedUser.deviceId || "No device assigned"}</p>
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
                <input
                  type="checkbox"
                  checked={systemData.solarCharging}
                  onChange={() => toggleField("solarCharging")}
                  disabled={!getUserDevice(selectedUser)}
                />
                <span className="slider"></span>
                Solar Charging
              </label>

              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={systemData.bulbOn}
                  onChange={() => toggleField("bulbOn")}
                  disabled={!getUserDevice(selectedUser)}
                />
                <span className="slider"></span>
                Bulb
              </label>

              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={systemData.wifiConnected}
                  onChange={() => toggleField("wifiConnected")}
                  disabled={true}
                />
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