// App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import MainPage from "./mainpage/MainPage.jsx";

import Header from "./components/Header.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";
import LoginForm from "./components/LoginForm.jsx";
import RegisterForm from "./components/RegisterForm.jsx";
import AboutUs from "./components/AboutUs.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import { app } from "./firebase/config.js";

export default function App() {
  const [user, setUser] = useState(null); 
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoggedIn(!!currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  return (
    <Router>
      <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<WelcomePage isLoggedIn={isLoggedIn} user={user} />} />
        <Route path="/login" element={<LoginForm setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/about" element={<AboutUs />} />

        {/* User Dashboard (Protected) */}
        <Route path="/dashboard" element={isLoggedIn ? <MainPage /> : <Navigate to="/login" replace />} />

        {/* Admin Dashboard (Protected) */}
        <Route
          path="/admin/dashboard"
          element={
            user?.email === "admin@example.com" ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}