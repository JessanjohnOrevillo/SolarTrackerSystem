// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase Web app configuration
const firebaseConfig = {
  apiKey: "AIzaSyD7RQOQMgW_ES7gXioAvk4qxN7sH4JjBas",
  authDomain: "solartrackersystem1-8885c.firebaseapp.com",
  projectId: "solartrackersystem1-8885c",
  storageBucket: "solartrackersystem1-8885c.firebasestorage.app",
  messagingSenderId: "528455226667",
  appId: "1:528455226667:web:fd54171acdf4b18b92e16e",
  measurementId: "G-1KM13LBSCQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);    // For Authentication (login/register)
export const db = getFirestore(app); // For Firestore (storing user info)
export { app };                      // ✅ Add this line