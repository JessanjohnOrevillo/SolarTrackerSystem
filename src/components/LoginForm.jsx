// LoginForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import BackButton from "../components/BackButton.jsx";
import "../styles/LoginForm.css";
import { app } from "../firebase/config.js";

export default function LoginForm({ setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1️⃣ Sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Get user info from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        alert("User record not found.");
        return;
      }

      const userData = userDoc.data();

      // 3️⃣ Check if user is approved
      if (!userData.approved) {
        alert("Your registration is pending approval by the admin.");
        return;
      }

      // ✅ User is approved
      setIsLoggedIn(true);
      setEmail("");
      setPassword("");

      navigate("/"); // go to WelcomePage

    } catch (error) {
      console.error("Login error:", error.message);
      alert("Invalid email or password");
    }
  };

  return (
    <div className="login-container">
      <BackButton />

      <div className="login-form">
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Log in to your account</p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="login-button">Log In</button>

          <p className="login-register-text">
            Doesn't have an account?
            <a href="/register">Register</a>
          </p>
        </form>
      </div>
    </div>
  );
}