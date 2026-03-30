import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { app } from "../firebase/config.js";
import "./adminCSS/SystemStatusCards.css";

const db = getFirestore(app);

export default function SystemStatusCards() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [devices, setDevices] = useState([]);
  const [systemData, setSystemData] = useState({
    battery: 0,
    solarCharging: false,
    bulbOn: false,
    wifiConnected: false,
    voltage: 0,
    solarInput: 0,
    temperature: 0
  });

  // Fetch users from Firestore once
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

    // Real-time users listener
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    });

    // Real-time devices listener
    const unsubDevices = onSnapshot(collection(db, "availableDevices"), (snapshot) => {
      const deviceList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDevices(deviceList);
      
      // If a user is selected, update their system data in real-time
      if (selectedUser) {
        const updatedDevice = deviceList.find(d => d.id === selectedUser.deviceId && d.online === true);
        if (updatedDevice) {
          setSystemData({
            battery: updatedDevice.battery || 0,
            solarCharging: updatedDevice.solarCharging || false,
            bulbOn: updatedDevice.bulbOn || false,
            wifiConnected: true,
            voltage: updatedDevice.voltage || 0,
            solarInput: updatedDevice.solarInput || 0,
            temperature: updatedDevice.temperature || 0
          });
        } else if (selectedUser) {
          // Device went offline
          setSystemData(prev => ({
            ...prev,
            wifiConnected: false
          }));
        }
      }
    });

    return () => {
      unsubUsers();
      unsubDevices();
    };
  }, [selectedUser]);

  // Open modal for user
  const openModal = (user) => {
    setSelectedUser(user);

    const device = getUserDevice(user);

    setSystemData({
      battery: device?.battery || 0,
      solarCharging: device?.solarCharging || false,
      bulbOn: device?.bulbOn || false,
      wifiConnected: device ? true : false,
      voltage: device?.voltage || 0,
      solarInput: device?.solarInput || 0,
      temperature: device?.temperature || 0
    });

    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const getUserDevice = (user) => {
    return devices.find(d => d.id === user.deviceId && d.online === true);
  };

  // Toggle system fields and update Firestore
  const toggleField = async (field) => {
    const newValue = !systemData[field];
    setSystemData(prev => ({ ...prev, [field]: newValue }));

    if (selectedUser) {
      const userDevice = getUserDevice(selectedUser);
      if (!userDevice) return; // Cannot toggle if device is offline

      const deviceRef = doc(db, "availableDevices", userDevice.id);
      await updateDoc(deviceRef, { [field]: newValue });
    }
  };

  return (
    <div className="system-status-container">
      <h3 className="gradient-text">Users System Status</h3>

      <div className="user-cards">
        {users.map(user => {
          const isOnline = getUserDevice(user);
          return (
            <div key={user.id} className="user-card-wrapper">
              {/* Status label CENTERED above the card */}
              
              
              {/* Card container */}
              <div
                className={`user-card ${isOnline ? "online" : "offline"}`}
                onClick={() => openModal(user)}
              >
                <h4 className="gradient-text">{user.firstName} {user.lastName}</h4>
                <p className="gradient-text">{user.email}</p>
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
                  disabled={!getUserDevice(selectedUser)}
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