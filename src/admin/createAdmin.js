// src/admin/createAdmin.js
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Firebase config (same as your config.js)
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
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      "admin@example.com",
      "Admin123" 
    );
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      firstName: "Admin",
      lastName: "Admin", 
      email: "admin@example.com",
      role: "admin",
      approved: true
    });

    console.log("Admin account created successfully!");
  } catch (error) {
    console.error("Error creating admin:", error.message);
  }
}

createAdmin();