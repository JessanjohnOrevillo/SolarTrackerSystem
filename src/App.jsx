// App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import Header from "./components/Header.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";
import LoginForm from "./components/LoginForm.jsx";
import RegisterForm from "./components/RegisterForm.jsx";
import AboutUs from "./components/AboutUs.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import { app } from "./firebase/config.js";

export default function App() {
  const [user, setUser] = useState(null); // store Firebase user
  const auth = getAuth(app);

  // Keep user logged in on refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  return (
    <Router>
      <Header isLoggedIn={!!user} setIsLoggedIn={() => {}} />

      <Routes>
        <Route path="/" element={<WelcomePage isLoggedIn={!!user} user={user} />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/about" element={<AboutUs />} />

        {/* Admin route only accessible to admin email */}
        {user?.email === "admin@example.com" && (
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        )}
      </Routes>
    </Router>
  );
}