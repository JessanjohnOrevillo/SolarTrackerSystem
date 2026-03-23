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
        severity,
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
        const randomBattery = Math.floor(Math.random() * 101);
        const randomSolarCharging = Math.random() < 0.5;
        const randomBulbOn = Math.random() < 0.5;
        const randomWifiConnected = Math.random() < 0.5;
        const randomVoltage = parseFloat((10 + Math.random() * 5).toFixed(1));
        const randomSolarInput = parseFloat((15 + Math.random() * 5).toFixed(1));
        const randomTemp = Math.floor(20 + Math.random() * 15);

        let severity = "Info";
        if (randomBattery < 20) severity = "Critical";
        else if (randomBattery < 50) severity = "Warning";

        const eventMsg = `Battery: ${randomBattery}%, Solar: ${randomSolarCharging ? "ON" : "OFF"}, Bulb: ${randomBulbOn ? "ON" : "OFF"}, Wi-Fi: ${randomWifiConnected ? "Connected" : "Disconnected"}`;

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

        await createLog(user.id, `${user.firstName} ${user.lastName}`, eventMsg, severity);

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

  useEffect(() => {
    updateAllUsers();
    const interval = setInterval(updateAllUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleSolar = () => setSolarCharging(!solarCharging);
  const toggleBulb = () => setBulbOn(!bulbOn);
  const toggleWifi = () => setWifiConnected(!wifiConnected);

  const batteryColor = battery > 50 ? "#80ff00" : battery > 20 ? "#ffd700" : "#ff4c4c";

  const graphData = batteryHistory.map((value, index) => ({
    time: index + 1,
    battery: value
  }));

  return (
    <div className="mainpage-container">
      <BackButton />
      <h2 className="dashboard-title">Solar Tracker Monitoring System</h2>

      <div className="dashboard-cards">
        {/* Battery Card */}
        <div className="card battery-card">
          <h3>Battery</h3>
          <div className="battery-bar-container">
            <div className="battery-bar-fill" style={{ width: `${battery}%`, backgroundColor: batteryColor, boxShadow: `0 0 10px ${batteryColor}, 0 0 20px ${batteryColor}80` }} />
          </div>
          <p className="battery-percentage">{battery}%</p>
          <p>Voltage: {voltage} V</p>
        </div>

        {/* Temperature Card */}
        <div className="card temp-card">
          <h3>Temperature</h3>
          <p>{temperature}°C</p>
        </div>

        {/* Solar Charging Card */}
        <div className="card solar-card">
          <h3>Solar</h3>
          <p>{solarCharging ? "Charging" : "Not Charging"}</p>
          <p>Input: {solarInput} V</p>
        </div>

        {/* Bulb Card */}
        <div className="card bulb-card">
          <h3>Bulb</h3>
          <p>{bulbOn ? "ON" : "OFF"}</p>
        </div>

        {/* Wi-Fi Card */}
        <div className="card wifi-card">
          <h3>Wi-Fi</h3>
          <p>{wifiConnected ? "Connected" : "Disconnected"}</p>
        </div>
      </div>

      {/* Battery Graph */}
      <div className="battery-graph-container">
        <p>Battery Over Time</p>
        <ResponsiveContainer width="100%" height={200}>
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
      <div className="controls-container">
        <div className="control">
          <p>Solar Charging</p>
          <label className="switch">
            <input type="checkbox" checked={solarCharging} onChange={toggleSolar} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="control">
          <p>Bulb Control</p>
          <label className="switch">
            <input type="checkbox" checked={bulbOn} onChange={toggleBulb} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="control">
          <p>Wi-Fi</p>
          <button className="wifi-btn" onClick={toggleWifi}>
            {wifiConnected ? "Connected" : "Connect Wi-Fi"}
          </button>
        </div>
      </div>
    </div>
  );
}