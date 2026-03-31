// src/pages/RegisterForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import BackButton from "../components/BackButton.jsx";
import "../styles/RegisterForm.css";
import { app } from "../firebase/config.js";

export default function RegisterForm() {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Purok options
  const purokOptions = [
    "Purok 1",
    "Purok 2", 
    "Purok 3",
    "Purok 4",
    "Purok 5",
    "Purok 6",
    "Purok 7"
  ];

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    purok: "", // New purok field
    address: "Trinidad, Bohol", // Fixed address
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!form.purok) {
      alert("Please select your Purok");
      return;
    }

    if (
      !form.firstName ||
      !form.lastName ||
      !form.contact ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email.trim().toLowerCase(),
        form.password.trim()
      );

      const user = userCredential.user;

      // Combine purok and fixed address for full address
      const fullAddress = `${form.purok}, ${form.address}`;

      // Save user info + systemData
      await setDoc(doc(db, "users", user.uid), {
        firstName: form.firstName,
        lastName: form.lastName,
        contact: form.contact,
        address: fullAddress,
        barangay: form.address,
        purok: form.purok,
        email: form.email,
        role: "user",
        approved: false,
        systemData: {
          battery: 0,
          solarCharging: false,
          bulbOn: false,
          wifiConnected: false,
          voltage: 0,
          solarInput: 0,
          temperature: 0
        },
        updatedAt: new Date()
      });

      alert("Registration successful! Wait for admin approval.");

      setLoading(false);

      // Navigate after success
      setTimeout(() => {
        navigate("/login");
      }, 100);

    } catch (error) {
      console.error("Registration error:", error);

      if (error.code === "auth/email-already-in-use") {
        alert("Email already registered.");
      } else if (error.code === "auth/network-request-failed") {
        alert("Network error. Check your internet connection.");
      } else {
        alert(error.message);
      }

      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <BackButton />

      <div className="register-form">
        <h2 className="register-title">Create Account</h2>
        <p className="register-subtitle">Join the Solar Tracker team</p>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="row">
            <div className="col">
              <label>First Name</label>
              <input
                id="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
              />
            </div>

            <div className="col">
              <label>Last Name</label>
              <input
                id="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="row">
            <div className="col">
              <label>Contact Number</label>
              <input
                id="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder="Enter your contact number"
              />
            </div>

            <div className="col">
              <label>Purok</label>
              <select
                id="purok"
                value={form.purok}
                onChange={handleChange}
                className="purok-select"
                required
              >
                <option value="">Select Purok</option>
                {purokOptions.map((purok) => (
                  <option key={purok} value={purok}>
                    {purok}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label>Barangay</label>
          <input
            id="address"
            value={form.address}
            disabled
            className="disabled-input"
          />

          <label>Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            autoComplete="new-email"
          />

          <div className="row">
            <div className="col">
              <label>Password</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁"}
                </span>
              </div>
            </div>

            <div className="col">
              <label>Confirm Password</label>
              <div className="password-field">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
                <span
                  className="eye-icon"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? "🙈" : "👁"}
                </span>
              </div>
            </div>
          </div>

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>

          <p className="register-login-text">
            Already have an account?
            <a href="/login">Log In</a>
          </p>
        </form>
      </div>
    </div>
  );
}