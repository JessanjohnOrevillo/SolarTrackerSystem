// src/admin/LogsAlerts.jsx
import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { app } from "../firebase/config.js";
import "./adminCSS/LogsAlerts.css";

const db = getFirestore(app);
const PAGE_SIZE = 10;

export default function LogsAlerts() {
  const [allLogs, setAllLogs] = useState([]);
  const [usersCache, setUsersCache] = useState({});
  const [activeTab, setActiveTab] = useState("Logs");
  
  // Pagination states for Logs
  const [logs, setLogs] = useState([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  
  // Pagination states for Alerts
  const [alerts, setAlerts] = useState([]);
  const [alertsPage, setAlertsPage] = useState(1);
  const [alertsTotalPages, setAlertsTotalPages] = useState(1);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch user data by ID
  const fetchUserData = async (userId) => {
    if (!userId || usersCache[userId]) return;
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUsersCache(prev => ({
          ...prev,
          [userId]: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            address: userData.address,
            email: userData.email
          }
        }));
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  // Fetch all logs for pagination
  useEffect(() => {
    const logsQuery = query(
      collection(db, "deviceLogs"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(logsQuery, async (snapshot) => {
      const logsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp)
        };
      });
      setAllLogs(logsList);
      
      // Fetch user data for each log
      logsList.forEach(log => {
        if (log.userId) {
          fetchUserData(log.userId);
        }
      });
    }, (error) => {
      console.error("Error fetching logs:", error);
    });

    return () => unsubscribe();
  }, []);

  // Filter logs based on search and tab
  const getFilteredLogs = () => {
    let filtered = [...allLogs];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => {
        const user = usersCache[log.userId];
        return (user?.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
               (user?.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
               (log.deviceId && log.deviceId.toLowerCase().includes(searchTerm.toLowerCase())) ||
               (log.action && log.action.toLowerCase().includes(searchTerm.toLowerCase()));
      });
    }
    
    // Separate alerts from regular logs
    const isAlert = (log) => {
      return log.severity === "warning" || 
             log.severity === "critical" ||
             log.action === "battery_warning" ||
             log.action === "battery_critical" ||
             log.action === "device_offline";
    };
    
    if (activeTab === "Logs") {
      return filtered.filter(log => !isAlert(log));
    } else {
      return filtered.filter(log => isAlert(log));
    }
  };

  // Update pagination when filtered logs change
  useEffect(() => {
    const filtered = getFilteredLogs();
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    
    if (activeTab === "Logs") {
      setLogsTotalPages(totalPages);
      const start = (logsPage - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      setLogs(filtered.slice(start, end));
    } else {
      setAlertsTotalPages(totalPages);
      const start = (alertsPage - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      setAlerts(filtered.slice(start, end));
    }
  }, [allLogs, activeTab, logsPage, alertsPage, searchTerm, usersCache]);

  // Reset page when tab changes
  useEffect(() => {
    if (activeTab === "Logs") {
      setLogsPage(1);
    } else {
      setAlertsPage(1);
    }
  }, [activeTab, searchTerm]);

  // Helper to format the event message
  const formatEvent = (log) => {
    switch(log.action) {
      case "bulb_toggle":
      case "bulb_web":
      case "bulb_remote":
        return `Bulb turned ${log.newValue === "ON" ? "ON" : "OFF"}`;
      case "solar_web":
      case "solar_remote":
        return `Solar charging ${log.newValue === "ON" ? "enabled" : "disabled"}`;
      case "battery_warning":
        return `⚠️ Battery low: ${log.newValue}`;
      case "battery_critical":
        return `🔴 Battery critical: ${log.newValue}`;
      case "device_online":
        return `Device went ONLINE`;
      case "device_offline":
        return `🔴 Device went OFFLINE`;
      case "device_boot":
        return `Device booted up`;
      default:
        return log.action || "Unknown action";
    }
  };

  // Helper to get severity class
  const getSeverityClass = (log) => {
    if (log.severity === "critical" || log.action === "battery_critical" || log.action === "device_offline") {
      return "critical";
    }
    if (log.severity === "warning" || log.action === "battery_warning") {
      return "warning";
    }
    return "info";
  };

  // Helper to get user full name
  const getUserName = (log) => {
    const user = usersCache[log.userId];
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    return log.userEmail || "System";
  };

  // Helper to get user address
  const getUserAddress = (log) => {
    const user = usersCache[log.userId];
    return user?.address || "—";
  };

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="pagination">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn prev"
        >
          ← Previous
        </button>
        
        {startPage > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="pagination-btn">1</button>
            {startPage > 2 && <span className="pagination-dots">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
          >
            {page}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="pagination-dots">...</span>}
            <button onClick={() => onPageChange(totalPages)} className="pagination-btn">{totalPages}</button>
          </>
        )}
        
        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn next"
        >
          Next →
        </button>
      </div>
    );
  };

  return (
    <div className="logs-container">
      <h3>System Logs & Alerts</h3>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="🔍 Search by name, device, or action..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="tab-buttons">
        <button
          className={activeTab === "Logs" ? "active-tab" : ""}
          onClick={() => setActiveTab("Logs")}
        >
          📋 Logs ({getFilteredLogs().length})
        </button>
        <button
          className={activeTab === "Alerts" ? "active-tab" : ""}
          onClick={() => setActiveTab("Alerts")}
        >
          ⚠️ Alerts ({getFilteredLogs().filter(l => 
            l.severity === "warning" || l.severity === "critical" ||
            l.action === "battery_warning" || l.action === "battery_critical" ||
            l.action === "device_offline"
          ).length})
        </button>
      </div>

      {activeTab === "Logs" && (
        <>
          <div className="logs-table">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>First Name</th>
                  <th>Device</th>
                  <th>Address</th>
                  <th>Event</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>No logs found</td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id}>
                      <td>{log.timestamp?.toLocaleString?.() || new Date(log.timestamp).toLocaleString()}</td>
                      <td className="gradient-text">{getUserName(log)}</td>
                      <td>{log.deviceId || "—"}</td>
                      <td>{getUserAddress(log)}</td>
                      <td className={getSeverityClass(log)}>{formatEvent(log)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            currentPage={logsPage}
            totalPages={logsTotalPages}
            onPageChange={setLogsPage}
          />
        </>
      )}

      {activeTab === "Alerts" && (
        <>
          <div className="alerts-grid">
            {alerts.length === 0 ? (
              <p className="no-alerts">✅ No alerts at the moment. All systems normal.</p>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className={`alert-card ${getSeverityClass(alert)}`}>
                  <div className="alert-header">
                    <span className="alert-icon">
                      {getSeverityClass(alert) === "critical" ? "🔴" : getSeverityClass(alert) === "warning" ? "⚠️" : "ℹ️"}
                    </span>
                    <span className="alert-severity">{getSeverityClass(alert).toUpperCase()}</span>
                  </div>
                  <p className="alert-user"><strong>{getUserName(alert)}</strong></p>
                  <p className="alert-device">Device: {alert.deviceId || "—"}</p>
                  <p className="alert-address">📍 {getUserAddress(alert)}</p>
                  <p className="alert-message">{formatEvent(alert)}</p>
                  <p className="alert-time">{alert.timestamp?.toLocaleString?.() || new Date(alert.timestamp).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
          
          <Pagination 
            currentPage={alertsPage}
            totalPages={alertsTotalPages}
            onPageChange={setAlertsPage}
          />
        </>
      )}
    </div>
  );
}