// src/firebase/auth.js
import { auth, db } from "./config";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Register user
export const registerUser = async (userData) => {
  const { email, password, firstName, lastName, contact, address, role } = userData;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Save extra info in Firestore
    await setDoc(doc(db, "users", uid), {
      firstName,
      lastName,
      email,
      contact,
      address,
      role, // "user" or "admin"
    });

    return { success: true, uid };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Fetch role from Firestore
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return { success: true, role: userDoc.data().role };
    } else {
      return { success: false, error: "User data not found" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Logout
export const logoutUser = async () => {
  await signOut(auth);
};