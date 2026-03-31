// Header.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import MenuDropdown from "./MenuDropdown.jsx";
import "../styles/Header.css";
import { FaSun } from "react-icons/fa";
import { app } from "../firebase/config.js";

export default function Header({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const [userName, setUserName] = useState("");

  // Fetch user name when logged in
  useEffect(() => {
    if (isLoggedIn && auth.currentUser) {
      const fetchUserName = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(`${userData.firstName} ${userData.lastName}`);
          }
        } catch (error) {
          console.error("Error fetching user name:", error);
        }
      };
      fetchUserName();
    } else {
      setUserName("");
    }
  }, [isLoggedIn, auth.currentUser, db]);

  const handleLogoClick = () => {
    if (isLoggedIn) navigate("/");
    else navigate("/login");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      
      // Clear localStorage on logout
      localStorage.removeItem("currentUser");
      localStorage.removeItem("userEmail");
      
      // Clear any cached data
      sessionStorage.clear();
      
      // Clear user name
      setUserName("");
      
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <FaSun className="header-logo" onClick={handleLogoClick} />
        <h1 className="header-title">Solar Tracker System</h1>
      </div>

      <div className="header-right">
        {isLoggedIn && userName && (
          <span className="welcome-label">Welcome, {userName}!</span>
        )}
        <MenuDropdown 
          isLoggedIn={isLoggedIn} 
          setIsLoggedIn={setIsLoggedIn}
          onLogout={handleLogout}
        />
      </div>
    </header>
  );
}