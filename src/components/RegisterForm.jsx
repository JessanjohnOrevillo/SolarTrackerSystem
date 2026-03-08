// RegisterForm.jsx
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

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
if (
  !form.firstName ||
  !form.lastName ||
  !form.contact ||
  !form.address ||
  !form.email ||
  !form.password ||
  !form.confirmPassword
) {
  alert("Please fill in all fields");
  return;
}

    try {
      // 1️⃣ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;

      // 2️⃣ Save additional user info in Firestore with approved:false
      await setDoc(doc(db, "users", user.uid), {
        firstName: form.firstName,
        lastName: form.lastName,
        contact: form.contact,
        address: form.address,
        email: form.email,
        role: "user",
        approved: false  // user must be approved by admin
      });

      alert("Registration successful! Wait for admin approval.");

      // clear form
      setForm({
        firstName: "",
        lastName: "",
        contact: "",
        address: "",
        email: "",
        password: "",
        confirmPassword: ""
      });

      // redirect to login
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error.message);
      alert(error.message);
    }
  };

  return (
    <div className="register-container">
      <BackButton />
      <div className="register-form">
        <h2 className="register-title">Create Account</h2>
        <p className="register-subtitle">Join the Solar Tracker team</p>

        <form onSubmit={handleSubmit}>
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
              <label>Address</label>
              <input
                id="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter your address"
              />
            </div>
          </div>

          <label>Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />

          <div className="row">
            <div className="col">
              <label>Password</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
            </div>
            <div className="col">
              <label>Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <button type="submit" className="register-button">
            Register
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