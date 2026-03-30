import React, { useState, useEffect } from "react";
import "./MainPage.css";
import BackButton from "../components/BackButton.jsx";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  collection,
  updateDoc
} from "firebase/firestore";

import { getAuth } from "firebase/auth";
import { app } from "../firebase/config.js";

const db = getFirestore(app);
const auth = getAuth(app);

export default function MainPage() {
  const currentUser = auth.currentUser;

  // ------------------ SYSTEM STATES ------------------
  const [battery, setBattery] = useState(0);
  const [voltage, setVoltage] = useState(0);
  const [solarCharging, setSolarCharging] = useState(false);
  const [bulbOn, setBulbOn] = useState(false);
  const [temperature, setTemperature] = useState(0);
  const [solarInput, setSolarInput] = useState(0);
  const [batteryHistory, setBatteryHistory] = useState([]);
  const [wifiConnected, setWifiConnected] = useState(false);

  const [devices, setDevices] = useState([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to extract data from Firestore document
  const extractDeviceData = (docData) => {
    // If data has 'fields', it's in Firestore API format
    if (docData.fields) {
      const extracted = {};
      for (const [key, value] of Object.entries(docData.fields)) {
        if (value.stringValue !== undefined) extracted[key] = value.stringValue;
        else if (value.integerValue !== undefined) extracted[key] = value.integerValue;
        else if (value.doubleValue !== undefined) extracted[key] = value.doubleValue;
        else if (value.booleanValue !== undefined) extracted[key] = value.booleanValue;
      }
      return extracted;
    }
    return docData;
  };

  // ------------------ LISTEN TO AVAILABLE DEVICES ------------------
  useEffect(() => {
    const devicesCol = collection(db, "availableDevices");
    const unsubscribe = onSnapshot(devicesCol, (snapshot) => {
      const deviceList = snapshot.docs.map(doc => {
        const rawData = doc.data();
        const data = extractDeviceData(rawData);
        
        console.log(`📱 Device ${doc.id}:`, data);
        
        return {
          id: doc.id,
          name: data.name || data.deviceId || doc.id,
          ip: data.ip || "Unknown",
          battery: data.battery || 0,
          voltage: data.voltage || 0,
          ...data
        };
      });
      setDevices(deviceList);
      console.log("📱 Available devices:", deviceList);
    });

    return () => unsubscribe();
  }, []);

  // ------------------ LISTEN TO SELECTED DEVICE ------------------
  useEffect(() => {
    if (!selectedDevice) return;

    console.log(`🔍 Listening to device: ${selectedDevice.id}`);
    
    const deviceRef = doc(db, "availableDevices", selectedDevice.id);
    const unsubscribe = onSnapshot(deviceRef, (docSnap) => {
      if (!docSnap.exists()) {
        console.log("❌ Device document doesn't exist!");
        return;
      }
      
      const rawData = docSnap.data();
      const data = extractDeviceData(rawData);
      
      console.log("📊 Device data received:", data);
      
      // Update all states with the new data
      setBattery(data.battery ?? 0);
      setVoltage(data.voltage ?? 0);
      setSolarCharging(data.solarCharging ?? false);
      setBulbOn(data.bulbOn ?? false);
      setTemperature(data.temperature ?? 25.0);
      setSolarInput(data.solarInput ?? 0);
      
      setBatteryHistory(prev => [...prev.slice(-9), data.battery ?? 0]);
      setWifiConnected(true);
    }, (error) => {
      console.error("Error listening to device:", error);
    });

    return () => unsubscribe();
  }, [selectedDevice]);

  // ------------------ TOGGLE FUNCTIONS WITH DIRECT CONTROL ------------------
  const toggleSolar = async () => {
    if (!selectedDevice) {
      console.log("❌ No device selected");
      return;
    }
    
    const newState = !solarCharging;
    console.log(`🔄 Toggling Solar: ${solarCharging} -> ${newState}`);
    
    // Update UI immediately
    setSolarCharging(newState);
    setIsLoading(true);
    
    // Try direct HTTP to ESP32 first
    try {
      const response = await fetch(`http://${selectedDevice.ip}/api/solar?state=${newState ? 'on' : 'off'}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        console.log("✅ Solar toggled instantly via direct connection");
      } else {
        console.log("⚠️ Direct control failed, using Firestore");
        const deviceRef = doc(db, "availableDevices", selectedDevice.id);
        await updateDoc(deviceRef, { solarCharging: newState });
      }
    } catch (error) {
      console.log("❌ Direct control error, using Firestore:", error.message);
      const deviceRef = doc(db, "availableDevices", selectedDevice.id);
      await updateDoc(deviceRef, { solarCharging: newState });
    }
    
    setIsLoading(false);
  };

  const toggleBulb = async () => {
    if (!selectedDevice) {
      console.log("❌ No device selected");
      return;
    }
    
    const newState = !bulbOn;
    console.log(`🔄 Toggling Bulb: ${bulbOn} -> ${newState}`);
    
    // Update UI immediately
    setBulbOn(newState);
    setIsLoading(true);
    
    // Try direct HTTP to ESP32 first
    try {
      const response = await fetch(`http://${selectedDevice.ip}/api/bulb?state=${newState ? 'on' : 'off'}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        console.log("✅ Bulb toggled instantly via direct connection");
      } else {
        console.log("⚠️ Direct control failed, using Firestore");
        const deviceRef = doc(db, "availableDevices", selectedDevice.id);
        await updateDoc(deviceRef, { bulbOn: newState });
      }
    } catch (error) {
      console.log("❌ Direct control error, using Firestore:", error.message);
      const deviceRef = doc(db, "availableDevices", selectedDevice.id);
      await updateDoc(deviceRef, { bulbOn: newState });
    }
    
    setIsLoading(false);
  };

  // ------------------ TEST ESP32 CONNECTION ------------------
  const testESP32Connection = async () => {
    if (!selectedDevice) return;
    
    console.log(`🔍 Testing connection to ${selectedDevice.ip}...`);
    
    try {
      const response = await fetch(`http://${selectedDevice.ip}/api/data`);
      if (response.ok) {
        const data = await response.json();
        console.log("✅ ESP32 is reachable!", data);
        alert(`ESP32 is connected!\nBattery: ${data.battery}%\nVoltage: ${data.voltage}V`);
      } else {
        console.log("❌ ESP32 responded with error");
        alert("ESP32 is reachable but returned an error");
      }
    } catch (error) {
      console.log("❌ Cannot reach ESP32:", error.message);
      alert(`Cannot reach ESP32 at ${selectedDevice.ip}\n\nMake sure:\n1. Your phone/computer is on the same WiFi\n2. ESP32 is powered on\n3. IP address is correct`);
    }
  };

  // ------------------ FORCE REFRESH DATA ------------------
  const refreshData = async () => {
    if (!selectedDevice) return;
    
    console.log("🔄 Forcing data refresh...");
    const deviceRef = doc(db, "availableDevices", selectedDevice.id);
    const docSnap = await getDoc(deviceRef);
    if (docSnap.exists()) {
      const data = extractDeviceData(docSnap.data());
      console.log("Refreshed data:", data);
      setBattery(data.battery ?? 0);
      setVoltage(data.voltage ?? 0);
      setSolarCharging(data.solarCharging ?? false);
      setBulbOn(data.bulbOn ?? false);
    }
  };

  // ------------------ DEVICE SELECTION ------------------
  const selectDevice = (device) => {
    console.log("📱 Selected device:", device);
    setSelectedDevice(device);
    setShowDeviceModal(false);
    setWifiConnected(false);
    
    // Test connection after selection
    setTimeout(() => testESP32Connection(), 1000);
  };

  // ------------------ BATTERY GRAPH ------------------
  const batteryColor =
    battery > 50 ? "#80ff00" :
    battery > 20 ? "#ffd700" :
    "#ff4c4c";

  const graphData = batteryHistory.map((value, index) => ({
    time: index + 1,
    battery: value
  }));

  return (
    <div className="mainpage-container">
      <BackButton />
      <h2 className="dashboard-title">Solar Tracker Monitoring System</h2>

      <div className="dashboard-cards">
        <div className="card battery-card">
          <h3>Battery</h3>
          <div className="battery-bar-container">
            <div
              className="battery-bar-fill"
              style={{
                width: `${battery}%`,
                backgroundColor: batteryColor,
                boxShadow: `0 0 10px ${batteryColor}, 0 0 20px ${batteryColor}80`
              }}
            />
          </div>
          <p className="battery-percentage">{battery}%</p>
          <p>Voltage: {voltage.toFixed(1)} V</p>
        </div>

        <div className="card temp-card">
          <h3>Temperature</h3>
          <p>{temperature.toFixed(1)}°C</p>
        </div>

        <div className="card solar-card">
          <h3>Solar</h3>
          <p>{solarCharging ? "⚡ Charging" : "⏸️ Not Charging"}</p>
          <p>Input: {solarInput.toFixed(1)} V</p>
        </div>

        <div className="card bulb-card">
          <h3>Bulb</h3>
          <p style={{ color: bulbOn ? "#ffd700" : "#666", fontSize: "24px", fontWeight: "bold" }}>
            {bulbOn ? "💡 ON" : "⚫ OFF"}
          </p>
        </div>

        <div className="card wifi-card">
          <h3>ESP32 Device</h3>
          <button className="wifi-btn" onClick={() => setShowDeviceModal(true)}>
            {selectedDevice
              ? `✅ Connected: ${selectedDevice.name}`
              : "🔌 Connect Device"}
          </button>
          {selectedDevice && (
            <div style={{ marginTop: "10px" }}>
              <p className="device-ip">IP: {selectedDevice.ip}</p>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button 
                  onClick={testESP32Connection}
                  style={{ padding: "5px 10px", fontSize: "12px", flex: 1 }}
                >
                  Test Connection
                </button>
                <button 
                  onClick={refreshData}
                  style={{ padding: "5px 10px", fontSize: "12px", flex: 1 }}
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Battery graph */}
      <div className="battery-graph-container">
        <p>Battery Over Time (Last 10 readings)</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
            <XAxis dataKey="time" stroke="#fff" />
            <YAxis stroke="#fff" domain={[0, 100]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="battery"
              stroke={batteryColor}
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Controls */}
      <div className="controls-container">
        <div className="control">
          <p>Solar Charging</p>
          <label className="switch">
            <input
              type="checkbox"
              checked={solarCharging}
              onChange={toggleSolar}
              disabled={isLoading || !selectedDevice}
            />
            <span className="slider"></span>
          </label>
          {isLoading && <span style={{ marginLeft: "10px" }}>⏳</span>}
        </div>

        <div className="control">
          <p>Bulb Control</p>
          <label className="switch">
            <input
              type="checkbox"
              checked={bulbOn}
              onChange={toggleBulb}
              disabled={isLoading || !selectedDevice}
            />
            <span className="slider"></span>
          </label>
          {isLoading && <span style={{ marginLeft: "10px" }}>⏳</span>}
        </div>
      </div>

      {/* Device selection modal */}
      {showDeviceModal && (
        <div className="device-modal">
          <div className="device-modal-content">
            <h3>Select ESP32 Device</h3>
            {devices.length === 0 && (
              <p>No devices found. Make sure ESP32 is connected to WiFi.</p>
            )}
            {devices.map((device) => (
              <button
                key={device.id}
                className="device-btn"
                onClick={() => selectDevice(device)}
              >
                {device.name} - {device.ip}
                {device.battery > 0 && ` (${device.battery}%)`}
              </button>
            ))}
            <button
              className="close-btn"
              onClick={() => setShowDeviceModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}