import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/WelcomePage.css";
import BackButton from "../components/BackButton.jsx";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../firebase/config.js";

export default function WelcomePage({ isLoggedIn }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (isLoggedIn) {
        const auth = getAuth(app);
        const db = getFirestore(app);
        const user = auth.currentUser;

        if (user) {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.role === "admin") setIsAdmin(true);
          }
        }
      }
    };
    checkAdmin();
  }, [isLoggedIn]);

  return (
    <div className="welcome-container">
      <BackButton />

      <div className="welcome-content">
        <p className="welcome-small">Welcome to</p>
        <h1 className="welcome-large">Solar Tracker System</h1>
        <p className="welcome-medium">
          Experience the future of renewable energy with our intelligent solar
          tracking system. Maximize efficiency, store energy smartly, and monitor
          in real time.
        </p>

        {!isLoggedIn && (
          <div className="welcome-buttons">
            <button
              className="login-btn"
              onClick={() => navigate("/login")}
            >
              Log In
            </button>

            <button
              className="register-btn"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </div>
        )}
      </div>

      {/* Separate container for Admin Dashboard */}
      {isAdmin && (
        <div className="admin-button-container">
          <button
            className="admin-dashboard-btn"
            onClick={() => navigate("/admin/dashboard")}
          >
            Admin Dashboard
          </button>
        </div>
      )}

      {/* Separate container for Solar Tracker Dashboard */}
      {isLoggedIn && (
  <div className="mainpage-button-container">
    <button
      className="mainpage-dashboard-btn"
      onClick={() => navigate("/dashboard")}
    >
      Solar Tracker Dashboard
    </button>
  </div>
)}
    </div>
  );
}