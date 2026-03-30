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
  collection,
  onSnapshot,
  updateDoc,
  getDoc
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

  // ------------------ EXTRACT FIRESTORE DATA ------------------
  const extractDeviceData = (docData) => {
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

    const unsubscribe = onSnapshot(devicesCol, async (snapshot) => {
      const deviceList = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = extractDeviceData(doc.data());
        const device = {
          id: doc.id,
          name: data.name || data.deviceId || doc.id,
          ip: data.ip || "Unknown",
          battery: data.battery || 0,
          ...data
        };

        // Ping device to see if it's online
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const res = await fetch(`http://${device.ip}/api/data`, { signal: controller.signal });
          clearTimeout(timeoutId);
          device.isOnline = res.ok;
        } catch {
          device.isOnline = false;
        }

        return device;
      }));

      setDevices(deviceList);
    });

    return () => unsubscribe();
  }, []);

  // ------------------ LISTEN TO SELECTED DEVICE ------------------
  useEffect(() => {
    if (!selectedDevice) return;

    const deviceRef = doc(db, "availableDevices", selectedDevice.id);
    const unsubscribe = onSnapshot(deviceRef, (docSnap) => {
      if (!docSnap.exists()) return;

      const data = extractDeviceData(docSnap.data());

      setBattery(data.battery ?? 0);
      setVoltage(data.voltage ?? 0);
      setSolarCharging(data.solarCharging ?? false);
      setBulbOn(data.bulbOn ?? false);
      setTemperature(data.temperature ?? 25.0);
      setSolarInput(data.solarInput ?? 0);
      setBatteryHistory(prev => [...prev.slice(-9), data.battery ?? 0]);
      setWifiConnected(true);
    });

    return () => unsubscribe();
  }, [selectedDevice]);

  // ------------------ TOGGLE FUNCTIONS ------------------
  const toggleSolar = async () => {
    if (!selectedDevice) return;
    const newState = !solarCharging;
    setSolarCharging(newState);
    setIsLoading(true);

    try {
      const response = await fetch(`http://${selectedDevice.ip}/api/solar?state=${newState ? 'on' : 'off'}`);
      if (!response.ok) {
        const deviceRef = doc(db, "availableDevices", selectedDevice.id);
        await updateDoc(deviceRef, { solarCharging: newState });
      }
    } catch {
      const deviceRef = doc(db, "availableDevices", selectedDevice.id);
      await updateDoc(deviceRef, { solarCharging: newState });
    }

    setIsLoading(false);
  };

  const toggleBulb = async () => {
    if (!selectedDevice) return;
    const newState = !bulbOn;
    setBulbOn(newState);
    setIsLoading(true);

    try {
      const response = await fetch(`http://${selectedDevice.ip}/api/bulb?state=${newState ? 'on' : 'off'}`);
      if (!response.ok) {
        const deviceRef = doc(db, "availableDevices", selectedDevice.id);
        await updateDoc(deviceRef, { bulbOn: newState });
      }
    } catch {
      const deviceRef = doc(db, "availableDevices", selectedDevice.id);
      await updateDoc(deviceRef, { bulbOn: newState });
    }

    setIsLoading(false);
  };

  // ------------------ TEST ESP32 CONNECTION ------------------
  const testESP32Connection = async () => {
    if (!selectedDevice) return;

    try {
      const response = await fetch(`http://${selectedDevice.ip}/api/data`);
      if (response.ok) {
        const data = await response.json();
        alert(`ESP32 is connected!\nBattery: ${data.battery}%\nVoltage: ${data.voltage}V`);
      } else alert("ESP32 responded with error");
    } catch (error) {
      alert(`Cannot reach ESP32 at ${selectedDevice.ip}\n\n${error.message}`);
    }
  };

  // ------------------ FORCE REFRESH ------------------
  const refreshData = async () => {
    if (!selectedDevice) return;
    const deviceRef = doc(db, "availableDevices", selectedDevice.id);
    const docSnap = await getDoc(deviceRef);
    if (docSnap.exists()) {
      const data = extractDeviceData(docSnap.data());
      setBattery(data.battery ?? 0);
      setVoltage(data.voltage ?? 0);
      setSolarCharging(data.solarCharging ?? false);
      setBulbOn(data.bulbOn ?? false);
    }
  };

  // ------------------ SELECT DEVICE ------------------
  const selectDevice = async (device) => {
    setSelectedDevice(device);
    setShowDeviceModal(false);
    setWifiConnected(false);

    try {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, { deviceId: device.id });
      }
    } catch (error) {
      console.error(error);
    }

    setTimeout(() => testESP32Connection(), 1000);
  };

  // ------------------ BATTERY GRAPH ------------------
  const batteryColor =
    battery > 50 ? "#80ff00" :
    battery > 20 ? "#ffd700" :
    "#ff4c4c";

  const graphData = batteryHistory.map((value, index) => ({ time: index + 1, battery: value }));

  return (
    <div className="mainpage-container">
      <BackButton />
      <h2 className="dashboard-title">Solar Tracker Monitoring System</h2>

      {/* SYSTEM CARDS */}
      <div className="dashboard-cards">
        <div className="card battery-card">
          <h3>Battery</h3>
          <div className="battery-bar-container">
            <div className="battery-bar-fill" style={{ width: `${battery}%`, backgroundColor: batteryColor, boxShadow: `0 0 10px ${batteryColor}, 0 0 20px ${batteryColor}80` }} />
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
            {selectedDevice ? `✅ Connected: ${selectedDevice.name}` : "🔌 Connect Device"}
          </button>
          {selectedDevice && (
            <div style={{ marginTop: "10px" }}>
              <p className="device-ip">IP: {selectedDevice.ip}</p>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button onClick={testESP32Connection} style={{ padding: "5px 10px", fontSize: "12px", flex: 1 }}>Test Connection</button>
                <button onClick={refreshData} style={{ padding: "5px 10px", fontSize: "12px", flex: 1 }}>Refresh</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BATTERY GRAPH */}
      <div className="battery-graph-container">
        <p>Battery Over Time (Last 10 readings)</p>
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
            <input type="checkbox" checked={solarCharging} onChange={toggleSolar} disabled={isLoading || !selectedDevice} />
            <span className="slider"></span>
          </label>
          {isLoading && <span style={{ marginLeft: "10px" }}>⏳</span>}
        </div>

        <div className="control">
          <p>Bulb Control</p>
          <label className="switch">
            <input type="checkbox" checked={bulbOn} onChange={toggleBulb} disabled={isLoading || !selectedDevice} />
            <span className="slider"></span>
          </label>
          {isLoading && <span style={{ marginLeft: "10px" }}>⏳</span>}
        </div>
      </div>

      {/* DEVICE MODAL */}
      {showDeviceModal && (
        <div className="device-modal">
          <div className="device-modal-content">
            <h3>Select ESP32 Device</h3>
            {devices.filter(d => d.isOnline || d.id === selectedDevice?.id).length === 0 && (
              <p>No devices online. Make sure ESP32 is powered and on the same WiFi.</p>
            )}
            {devices
              .filter(d => d.isOnline || d.id === selectedDevice?.id)
              .map(device => (
                <button key={device.id} className="device-btn" onClick={() => selectDevice(device)}>
                  {device.name} - {device.ip}{device.battery > 0 && ` (${device.battery}%)`}
                  {!device.isOnline && " ⚠️ Offline"}
                </button>
              ))}
            <button className="close-btn" onClick={() => setShowDeviceModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}