// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";  // Commented out for now
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC2B3fZm2sFcLahlhHEfqrflZSfEgcZjyU",
  authDomain: "solartrackerfinal.firebaseapp.com",
  databaseURL: "https://solartrackerfinal-default-rtdb.firebaseio.com",
  projectId: "solartrackerfinal",
  storageBucket: "solartrackerfinal.firebasestorage.app",
  messagingSenderId: "1048944120607",
  appId: "1:1048944120607:web:89bca155e6eaebcd2d962a",
  measurementId: "G-1SV01PXJ5J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);  // Commented out

// Initialize Firebase services
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
export { app };  // ← THIS IS THE FIX