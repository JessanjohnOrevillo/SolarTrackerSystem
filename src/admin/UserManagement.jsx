import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../firebase/config.js";
import "./adminCSS/UserManagement.css";

const db = getFirestore(app);
const auth = getAuth(app);

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Check authentication first
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is authenticated:", user.email);
        setCurrentUser(user);
      } else {
        console.log("No user is authenticated");
        setError("Please log in to access user management");
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Sort users function
  const sortUsers = (usersList) => {
    return usersList.sort((a, b) => {
      // Admins always first
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      
      // Then sort by approved status (pending first for non-admins)
      if (a.role !== 'admin' && b.role !== 'admin') {
        if (a.approved === false && b.approved === true) return -1;
        if (a.approved === true && b.approved === false) return 1;
      }
      
      // Then sort by first name
      return (a.firstName || '').localeCompare(b.firstName || '');
    });
  };

  // Fetch users only when authenticated
  useEffect(() => {
    if (!currentUser) return;

    let unsubscribe = null;
    
    const fetchUsersWithListener = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Attempting to fetch users for:", currentUser.email);
        
        unsubscribe = onSnapshot(
          collection(db, "users"),
          (snapshot) => {
            console.log("Snapshot received, size:", snapshot.size);
            
            if (snapshot.empty) {
              console.log("No users found in collection");
              setUsers([]);
              setLoading(false);
              return;
            }
            
            const usersList = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            }));
            
            console.log("Users loaded successfully:", usersList.length);
            
            // Sort users before setting state
            const sortedUsers = sortUsers(usersList);
            setUsers(sortedUsers);
            setLoading(false);
            setError(null);
          },
          (error) => {
            console.error("Detailed Firestore error:", error);
            
            if (error.code === 'permission-denied') {
              setError("Permission denied. Please contact administrator to update Firebase Security Rules.");
            } else if (error.code === 'unavailable') {
              setError("Firestore service is unavailable. Check your network.");
            } else {
              setError(`Failed to load users: ${error.message}`);
            }
            setLoading(false);
          }
        );
        
      } catch (err) {
        console.error("Setup error:", err);
        setError(`Setup error: ${err.message}`);
        setLoading(false);
      }
    };
    
    fetchUsersWithListener();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  // APPROVE USER
  const handleApprove = async (id) => {
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, {
        approved: true,
        updatedAt: new Date().toISOString(),
        approvedBy: currentUser?.email
      });
      console.log("User approved:", id);
      alert("User approved successfully!");
    } catch (error) {
      console.error("Error approving user:", error);
      alert(`Failed to approve user: ${error.message}`);
    }
  };

  // REJECT USER
  const handleReject = async (id) => {
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, {
        approved: false,
        updatedAt: new Date().toISOString(),
        rejectedBy: currentUser?.email
      });
      console.log("User rejected:", id);
      alert("User rejected successfully!");
    } catch (error) {
      console.error("Error rejecting user:", error);
      alert(`Failed to reject user: ${error.message}`);
    }
  };

  // DELETE USER
  const handleDelete = async (id, role, email) => {
    if (role === "admin") {
      alert("Admin account cannot be deleted.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user ${email}?`)) {
      return;
    }

    try {
      const userRef = doc(db, "users", id);
      await deleteDoc(userRef);
      console.log("User deleted:", id);
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(`Failed to delete user: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="user-management-container">
        <h3>Registered Users</h3>
        <div className="loading-state">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management-container">
        <h3>Registered Users</h3>
        <div className="error-state">
          <p>⚠️ {error}</p>
          {error.includes("Permission denied") && (
            <div className="error-help">
              <h4>How to fix this:</h4>
              <ol>
                <li>Go to Firebase Console → Firestore → Rules</li>
                <li>Update rules to allow authenticated read access</li>
                <li>Or use this rule for testing: <code>allow read, write: if true;</code></li>
              </ol>
            </div>
          )}
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <h3>Registered Users ({users.length})</h3>
      
      {users.length === 0 ? (
        <div className="no-users">
          <p>No users found in the database.</p>
          <p>Make sure you have added users to Firestore.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="user-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="user-id" title={user.id}>
                    {user.id ? `${user.id.slice(0, 6)}...${user.id.slice(-4)}` : 'N/A'}
                  </td>
                  <td>{user.firstName || user.firstname || 'N/A'}</td>
                  <td>{user.lastName || user.lastname || 'N/A'}</td>
                  <td>{user.email || 'N/A'}</td>
                  <td>{user.contact || user.phone || 'N/A'}</td>
                  <td>{user.address || 'N/A'}</td>
                  <td>
                    <span className={`role-badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td>
                    {user.approved ? (
                      <span className="status approved">✓ Approved</span>
                    ) : (
                      <span className="status pending">⏳ Pending</span>
                    )}
                  </td>
                  <td>
                    {user.role !== "admin" ? (
                      <div className="action-buttons">
                        {!user.approved && (
                          <button
                            className="approve-btn"
                            onClick={() => handleApprove(user.id)}
                          >
                            ✓ Accept
                          </button>
                        )}
                        {user.approved && (
                          <button
                            className="reject-btn"
                            onClick={() => handleReject(user.id)}
                          >
                            ✗ Reject
                          </button>
                        )}
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(user.id, user.role, user.email)}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    ) : (
                      <span className="admin-label">Admin Account</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}