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

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password.trim()
      );

      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        alert("User record not found.");
        setLoading(false);
        return;
      }

      const userData = userDoc.data();

      if (!userData.approved) {
        alert("Your registration is pending approval by the admin.");
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      setEmail("");
      setPassword("");
      setLoading(false);

      navigate("/");

    } catch (error) {
      console.error("Login error:", error);

      if (error.code === "auth/network-request-failed") {
        alert("Network error. Please check your internet connection.");
      } 
      else if (error.code === "auth/wrong-password") {
        alert("Incorrect password.");
      } 
      else if (error.code === "auth/user-not-found") {
        alert("No account found with this email.");
      } 
      else {
        alert(error.message);
      }

      setLoading(false);
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

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>

          <p className="login-register-text">
            Doesn't have an account?
            <a href="/register">Register</a>
          </p>
        </form>
      </div>
    </div>
  );
}