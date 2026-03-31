// src/admin/createAdmin.js
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// NEW config (solartrackerfinal)
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