import React, { useState, useEffect } from "react";
import "./MainPage.css";
import BackButton from "../components/BackButton.jsx";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../firebase/config.js";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const firestore = getFirestore(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);

export default function MainPage() {
  const currentUser = auth.currentUser;
  const [deviceId, setDeviceId] = useState(null);
  const [deviceData, setDeviceData] = useState({
    battery: 0,
    voltage: 0,
    solarCharging: false,
    bulbOn: false,
    temperature: 0,
    solarInput: 0,
    online: false
  });
  const [batteryHistory, setBatteryHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);

  // Load user's deviceId from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    const loadUserDevice = async () => {
      const userRef = doc(firestore, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const device = userDoc.data().deviceId;
        if (device && device !== "no_device" && device !== "") {
          setDeviceId(device);
        }
      }
    };
    loadUserDevice();
  }, [currentUser]);

  // Listen to Realtime Database for device data
  useEffect(() => {
    if (!deviceId) return;
    
    const deviceRef = ref(rtdb, `devices/${deviceId}`);
    const unsubscribe = onValue(deviceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDeviceData({
          battery: data.battery || 0,
          voltage: data.voltage || 0,
          solarCharging: data.solarCharging || false,
          bulbOn: data.bulbOn || false,
          temperature: data.temperature || 0,
          solarInput: data.solarInput || 0,
          online: data.online || false
        });
        
        // Update battery history (keep last 10 readings)
        setBatteryHistory(prev => {
          const newHistory = [...prev, data.battery || 0];
          return newHistory.slice(-10);
        });
      }
    });
    
    return () => unsubscribe();
  }, [deviceId]);

  // Get all available devices from Realtime Database
  useEffect(() => {
    const devicesRef = ref(rtdb, 'devices');
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const deviceList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setAvailableDevices(deviceList);
      }
    });
    return () => unsubscribe();
  }, []);

  // Disconnect from current device
  const disconnectDevice = async () => {
    setDeviceId(null);
    setDeviceData({
      battery: 0,
      voltage: 0,
      solarCharging: false,
      bulbOn: false,
      temperature: 0,
      solarInput: 0,
      online: false
    });
    setBatteryHistory([]);
    
    if (currentUser) {
      const userRef = doc(firestore, "users", currentUser.uid);
      await updateDoc(userRef, { deviceId: "" });
    }
    
    console.log("🔌 Disconnected from device");
  };

  // Toggle Solar Charging
  const toggleSolar = async () => {
    if (!deviceId) return;
    const newState = !deviceData.solarCharging;
    setIsLoading(true);
    
    try {
      const deviceRef = ref(rtdb, `devices/${deviceId}/solarCharging`);
      await set(deviceRef, newState);
      
      await addDoc(collection(firestore, "deviceLogs"), {
        deviceId: deviceId,
        userId: currentUser?.uid,
        action: "solarCharging",
        newValue: newState,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error toggling solar:", error);
    }
    
    setIsLoading(false);
  };

  // Toggle Bulb
  const toggleBulb = async () => {
    if (!deviceId) return;
    const newState = !deviceData.bulbOn;
    setIsLoading(true);
    
    try {
      const deviceRef = ref(rtdb, `devices/${deviceId}/bulbOn`);
      await set(deviceRef, newState);
      
      await addDoc(collection(firestore, "deviceLogs"), {
        deviceId: deviceId,
        userId: currentUser?.uid,
        action: "bulbOn",
        newValue: newState,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error toggling bulb:", error);
    }
    
    setIsLoading(false);
  };

  // Select a different device
  const selectDevice = async (device) => {
    setDeviceId(device.id);
    setShowDeviceModal(false);
    
    if (currentUser) {
      const userRef = doc(firestore, "users", currentUser.uid);
      await updateDoc(userRef, { deviceId: device.id });
    }
  };

  const batteryColor = deviceData.battery > 50 ? "#80ff00" : deviceData.battery > 20 ? "#ffd700" : "#ff4c4c";
  const graphData = batteryHistory.map((value, index) => ({ time: index + 1, battery: value }));

  return (
    <div className="mainpage-container">
      <BackButton />
      <h2 className="dashboard-title">Solar Tracker Monitoring System</h2>

      {/* Device Selection Button */}
      <div className="device-selector">
        <button className="select-device-btn" onClick={() => setShowDeviceModal(true)}>
          {deviceId ? `📱 Current Device: ${deviceId}` : "🔌 Select Device"}
        </button>
        
        {/* DISCONNECT BUTTON - ADDED */}
        {deviceId && (
          <button className="disconnect-btn" onClick={disconnectDevice}>
            🔌 Disconnect
          </button>
        )}
      </div>

      {/* Connection Status */}
      <div className={`connection-status ${deviceData.online ? "online" : "offline"}`}>
        {deviceData.online ? "🟢 Device Online" : "🔴 Device Offline"}
        {!deviceId && <span> - No device selected</span>}
      </div>

      {/* SYSTEM CARDS - Temperature Card REMOVED */}
      <div className="dashboard-cards">
        <div className="card battery-card">
          <h3>Battery</h3>
          <div className="battery-bar-container">
            <div className="battery-bar-fill" style={{ width: `${deviceData.battery}%`, backgroundColor: batteryColor }} />
          </div>
          <p className="battery-percentage">{deviceData.battery}%</p>
          <p>Voltage: {deviceData.voltage.toFixed(1)} V</p>
        </div>

        {/* TEMPERATURE CARD REMOVED */}

        <div className="card solar-card">
          <h3>Solar</h3>
          <p>{deviceData.solarCharging ? "⚡ Charging" : "⏸️ Not Charging"}</p>
          <p>Input: {deviceData.solarInput.toFixed(1)} V</p>
        </div>

        <div className="card bulb-card">
          <h3>Bulb</h3>
          <p style={{ color: deviceData.bulbOn ? "#ffd700" : "#666", fontSize: "24px", fontWeight: "bold" }}>
            {deviceData.bulbOn ? "💡 ON" : "⚫ OFF"}
          </p>
        </div>
      </div>

      {/* BATTERY GRAPH - RESTORED */}
      <div className="battery-graph-container">
        <p>Battery Over Time (Last {batteryHistory.length} readings)</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
            <XAxis dataKey="time" stroke="#fff" />
            <YAxis stroke="#fff" domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="battery" stroke={batteryColor} strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* CONTROLS */}
      <div className="controls-container">
        <div className="control">
          <p>Solar Charging</p>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={deviceData.solarCharging} 
              onChange={toggleSolar} 
              disabled={isLoading || !deviceData.online || !deviceId} 
            />
            <span className="slider"></span>
          </label>
          {isLoading && <span className="loading-spinner">⏳</span>}
        </div>

        <div className="control">
          <p>Bulb Control</p>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={deviceData.bulbOn} 
              onChange={toggleBulb} 
              disabled={isLoading || !deviceData.online || !deviceId} 
            />
            <span className="slider"></span>
          </label>
          {isLoading && <span className="loading-spinner">⏳</span>}
        </div>
      </div>

      {/* DEVICE MODAL */}
      {showDeviceModal && (
        <div className="device-modal">
          <div className="device-modal-content">
            <h3>Select Device</h3>
            {availableDevices.filter(d => d.online).length === 0 && (
              <p className="no-devices-msg">No online devices found. Make sure ESP32 is running.</p>
            )}
            {availableDevices
              .filter(d => d.online)
              .map(device => (
                <button 
                  key={device.id} 
                  className={`device-btn ${deviceId === device.id ? "active" : ""}`}
                  onClick={() => selectDevice(device)}
                >
                  {device.id} - Battery: {device.battery}%
                </button>
              ))}
            <button className="close-modal-btn" onClick={() => setShowDeviceModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}