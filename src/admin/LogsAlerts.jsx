// src/admin/LogsAlerts.jsx
import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { app } from "../firebase/config.js";
import "./adminCSS/LogsAlerts.css";

const db = getFirestore(app);

export default function LogsAlerts() {
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("Logs"); // "Logs" or "Alerts"

  const fetchLogs = async () => {
    try {
      const logsQuery = query(
        collection(db, "logs"),
        orderBy("timestamp", "desc"),
        limit(50)
      );
      const logsSnapshot = await getDocs(logsQuery);
      const logsList = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(logsList);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // refresh every 5 sec
    return () => clearInterval(interval);
  }, []);

  const alerts = logs.filter(log => log.severity === "Warning" || log.severity === "Critical");

  return (
    <div className="logs-container">
      <h3>System Logs & Alerts</h3>

      <div className="tab-buttons">
        <button
          className={activeTab === "Logs" ? "active-tab" : ""}
          onClick={() => setActiveTab("Logs")}
        >
          Logs
        </button>
        <button
          className={activeTab === "Alerts" ? "active-tab" : ""}
          onClick={() => setActiveTab("Alerts")}
        >
          Alerts
        </button>
      </div>

      {activeTab === "Logs" && (
        <div className="logs-table">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Event</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp?.seconds * 1000).toLocaleString()}</td>
                  <td className="gradient-text">{log.user}</td>
                  <td>{log.event}</td>
                  <td className={log.severity.toLowerCase()}>{log.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "Alerts" && (
        <div className="alerts-grid">
          {alerts.length === 0 && <p>No alerts at the moment</p>}
          {alerts.map(alert => (
            <div key={alert.id} className={`alert-card ${alert.severity.toLowerCase()}`}>
              <p className="gradient-text"><strong>{alert.user}</strong></p>
              <p>{alert.event}</p>
              <p>{new Date(alert.timestamp?.seconds * 1000).toLocaleString()}</p>
              <p className="severity">{alert.severity}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}