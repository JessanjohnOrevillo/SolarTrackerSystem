// src/mainpage/MainPage.jsx
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

import { getFirestore, collection, doc, setDoc, getDocs, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../firebase/config.js";

const db = getFirestore(app);
const auth = getAuth(app);

export default function MainPage() {
  const currentUser = auth.currentUser;

  const [battery, setBattery] = useState(85);
  const [solarCharging, setSolarCharging] = useState(true);
  const [bulbOn, setBulbOn] = useState(false);
  const [wifiConnected, setWifiConnected] = useState(true);
  const [voltage, setVoltage] = useState(12.8);
  const [solarInput, setSolarInput] = useState(18.5);
  const [temperature, setTemperature] = useState(35);
  const [batteryHistory, setBatteryHistory] = useState([70, 75, 80, 82, 85]);

  // Fetch all users
  const fetchUsers = async () => {
    const usersCol = collection(db, "users");
    const snapshot = await getDocs(usersCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  // Create a log entry
  const createLog = async (userId, userName, event, severity = "Info") => {
    try {
      const logsRef = collection(db, "logs");
      await addDoc(logsRef, {
        user: userName,
        userId,
        event,
        severity, // "Info", "Warning", "Critical"
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error creating log:", error);
    }
  };

  // Update all users with random data and create logs
  const updateAllUsers = async () => {
    try {
      const users = await fetchUsers();

      for (const user of users) {
        const randomBattery = Math.floor(Math.random() * 101); // 0–100%
        const randomSolarCharging = Math.random() < 0.5;
        const randomBulbOn = Math.random() < 0.5;
        const randomWifiConnected = Math.random() < 0.5;
        const randomVoltage = parseFloat((10 + Math.random() * 5).toFixed(1));
        const randomSolarInput = parseFloat((15 + Math.random() * 5).toFixed(1));
        const randomTemp = Math.floor(20 + Math.random() * 15);

        // Determine log severity
        let severity = "Info";
        if (randomBattery < 20) severity = "Critical";
        else if (randomBattery < 50) severity = "Warning";

        const eventMsg = `Battery: ${randomBattery}%, Solar: ${randomSolarCharging ? "ON" : "OFF"}, Bulb: ${randomBulbOn ? "ON" : "OFF"}, Wi-Fi: ${randomWifiConnected ? "Connected" : "Disconnected"}`;

        // Update user in Firestore
        const userRef = doc(db, "users", user.id);
        await setDoc(userRef, {
          systemData: {
            battery: randomBattery,
            solarCharging: randomSolarCharging,
            bulbOn: randomBulbOn,
            wifiConnected: randomWifiConnected,
            voltage: randomVoltage,
            solarInput: randomSolarInput,
            temperature: randomTemp
          },
          updatedAt: new Date()
        }, { merge: true });

        // Create log entry
        await createLog(user.id, `${user.firstName} ${user.lastName}`, eventMsg, severity);

        // If current logged-in user, update UI
        if (currentUser && currentUser.uid === user.id) {
          setBattery(randomBattery);
          setBatteryHistory(prev => [...prev.slice(-4), randomBattery]);
          setSolarCharging(randomSolarCharging);
          setBulbOn(randomBulbOn);
          setWifiConnected(randomWifiConnected);
          setVoltage(randomVoltage);
          setSolarInput(randomSolarInput);
          setTemperature(randomTemp);
        }
      }
    } catch (error) {
      console.error("Error updating all users:", error);
    }
  };

  // Run update every 5 seconds
  useEffect(() => {
    updateAllUsers(); // initial
    const interval = setInterval(updateAllUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleSolar = () => setSolarCharging(!solarCharging);
  const toggleBulb = () => setBulbOn(!bulbOn);
  const toggleWifi = () => setWifiConnected(!wifiConnected);

  const batteryColor =
    battery > 50 ? "#80ff00" :
    battery > 20 ? "#ffd700" :
    "#ff4c4c";

  const graphData = batteryHistory.map((value, index) => ({
    time: index + 1,
    battery: value
  }));

  return (
    <div className="dashboard-container">
      <BackButton />
      <h2 className="dashboard-title">Solar Tracker Monitoring System</h2>

      {/* Battery Status */}
      <div className="battery-status">
        <p>Battery Status</p>
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
        <p className="status-text">Voltage: {voltage} V</p>
      </div>

      {/* Battery Graph */}
      <div className="battery-graph">
        <p>Battery Over Time</p>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#555"/>
            <XAxis dataKey="time" stroke="#fff"/>
            <YAxis stroke="#fff"/>
            <Tooltip />
            <Line type="monotone" dataKey="battery" stroke={batteryColor} strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Controls */}
      <div className="control-row">
        <p>Solar Charging</p>
        <label className="switch">
          <input type="checkbox" checked={solarCharging} onChange={toggleSolar} />
          <span className="slider"></span>
        </label>
      </div>
      <p className="status-text">Charging: {solarCharging ? "ON" : "OFF"} | Input: {solarInput} V</p>

      <div className="control-row">
        <p>Bulb Control</p>
        <label className="switch">
          <input type="checkbox" checked={bulbOn} onChange={toggleBulb} />
          <span className="slider"></span>
        </label>
      </div>
      <p className="status-text">Bulb: {bulbOn ? "ON" : "OFF"}</p>

      <button className="wifi-btn" onClick={toggleWifi}>
        {wifiConnected ? "Connected" : "Connect Wi-Fi"}
      </button>
      <p className="status-text">Wi-Fi Status: {wifiConnected ? "Connected" : "Disconnected"}</p>
      <p className="status-text">Temperature: {temperature}°C</p>
    </div>
  );
}