// src/pages/LoginForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import BackButton from "../components/BackButton.jsx";
import "../styles/LoginForm.css";
import { app } from "../firebase/config.js";

export default function LoginForm({ setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setForgotPassword(false);
    setResetMessage("");
    setResetError("");
    setResetEmail("");

    if (emailInputRef.current) {
      emailInputRef.current.value = "";
      emailInputRef.current.defaultValue = "";
    }
    if (passwordInputRef.current) {
      passwordInputRef.current.value = "";
      passwordInputRef.current.defaultValue = "";
    }

    localStorage.removeItem("currentUser");
    localStorage.removeItem("userEmail");

    const form = document.querySelector("form");
    if (form) form.reset();

    setTimeout(() => {
      if (emailInputRef.current) emailInputRef.current.value = "";
      if (passwordInputRef.current) passwordInputRef.current.value = "";
      setEmail("");
      setPassword("");
    }, 50);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResetMessage("");
    setResetError("");

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

      // Prevent pending users from logging in
      if (!userData.approved) {
        alert("Your registration is pending approval by the admin.");

        // Clear any existing session/local storage
        localStorage.removeItem("currentUser");
        localStorage.removeItem("userEmail");

        await auth.signOut(); // Make sure user is logged out

        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      // Store user data
      localStorage.setItem("currentUser", JSON.stringify({ uid: user.uid, ...userData }));

      setLoading(false);

      setEmail("");
      setPassword("");
      if (emailInputRef.current) emailInputRef.current.value = "";
      if (passwordInputRef.current) passwordInputRef.current.value = "";

      setTimeout(() => {
        navigate("/");
      }, 100);

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage("");
    setResetError("");

    if (!resetEmail.trim()) {
      setResetError("Please enter your email address.");
      setResetLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim().toLowerCase());
      setResetMessage(`Password reset email sent to ${resetEmail}. Check your inbox.`);
      setResetError("");

      setResetEmail("");

      setTimeout(() => {
        setForgotPassword(false);
        setResetMessage("");
      }, 3000);

    } catch (error) {
      console.error("Password reset error:", error);

      if (error.code === "auth/user-not-found") {
        setResetError("No account found with this email address.");
      } else if (error.code === "auth/invalid-email") {
        setResetError("Please enter a valid email address.");
      } else {
        setResetError("Failed to send reset email. Please try again.");
      }
    }

    setResetLoading(false);
  };

  if (forgotPassword) {
    return (
      <div className="login-container">
        <BackButton />

        <div className="login-form">
          <h2 className="login-title">Reset Password</h2>
          <p className="login-subtitle">Enter your email to receive reset link</p>

          <form onSubmit={handleForgotPassword} autoComplete="off">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              autoComplete="off"
              required
            />

            {resetError && (
              <div className="error-message" style={{ color: "#ff6b6b", fontSize: "0.85rem", marginBottom: "10px", textAlign: "center" }}>
                {resetError}
              </div>
            )}

            {resetMessage && (
              <div className="success-message" style={{ color: "#80ff00", fontSize: "0.85rem", marginBottom: "10px", textAlign: "center" }}>
                {resetMessage}
              </div>
            )}

            <button type="submit" className="login-button" disabled={resetLoading}>
              {resetLoading ? "Sending..." : "Send Reset Email"}
            </button>

            <button 
              type="button" 
              className="back-to-login-btn" 
              onClick={() => {
                setForgotPassword(false);
                setResetMessage("");
                setResetError("");
              }}
              style={{
                width: "100%",
                padding: "0.8rem",
                marginTop: "10px",
                borderRadius: "0.5rem",
                border: "1px solid #ccc",
                background: "transparent",
                color: "#555",
                cursor: "pointer",
                fontSize: "0.9rem"
              }}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <BackButton />

      <div className="login-form">
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Log in to your account</p>

        <form onSubmit={handleSubmit} autoComplete="off" autoSave="off">
          <label>Email</label>
          <input
            ref={emailInputRef}
            id="email-input"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            autoSave="off"
            readOnly={false}
            required
          />

          <label>Password</label>
          <div className="password-field">
            <input
              ref={passwordInputRef}
              id="password-input"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              autoSave="off"
              readOnly={false}
              required
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          <div className="forgot-password-container" style={{ textAlign: "right", marginBottom: "15px" }}>
            <button
              type="button"
              onClick={() => setForgotPassword(true)}
              style={{
                background: "none",
                border: "none",
                color: "#00b894",
                cursor: "pointer",
                fontSize: "0.85rem",
                textDecoration: "underline"
              }}
            >
              Forgot Password?
            </button>
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