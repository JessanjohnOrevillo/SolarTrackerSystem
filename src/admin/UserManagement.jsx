import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

import { app } from "../firebase/config.js";
import "./adminCSS/UserManagement.css";

const db = getFirestore(app);

export default function UserManagement() {

  const [users, setUsers] = useState([]);

  // FETCH USERS
  const fetchUsers = async () => {

    try {

      const usersCol = collection(db, "users");
      const usersSnapshot = await getDocs(usersCol);

      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setUsers(usersList);

    } catch (error) {
      console.error("Error fetching users:", error);
    }

  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // APPROVE USER
  const handleApprove = async (id) => {

    try {

      const userRef = doc(db, "users", id);

      await updateDoc(userRef, {
        approved: true
      });

      fetchUsers();

    } catch (error) {
      console.error("Error approving user:", error);
    }

  };

  // REJECT USER
  const handleReject = async (id) => {

    try {

      const userRef = doc(db, "users", id);

      await updateDoc(userRef, {
        approved: false
      });

      fetchUsers();

    } catch (error) {
      console.error("Error rejecting user:", error);
    }

  };

  // DELETE USER
  const handleDelete = async (id, role) => {

    if (role === "admin") {
      alert("Admin account cannot be deleted.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {

      const userRef = doc(db, "users", id);
      await deleteDoc(userRef);

      fetchUsers();

    } catch (error) {
      console.error("Error deleting user:", error);
    }

  };

  return (

    <div className="user-management-container">

      <h3>Registered Users</h3>

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
  {user.id.slice(0, 6)}...{user.id.slice(-4)}
</td>

              <td>{user.firstName}</td>
              <td>{user.lastName}</td>
              <td>{user.email}</td>
              <td>{user.contact}</td>
              <td>{user.address}</td>
              <td>{user.role}</td>

              <td>

                {user.approved ? (

                  <span className="status approved">
                    Approved
                  </span>

                ) : (

                  <span className="status pending">
                    Pending
                  </span>

                )}

              </td>

              <td>

                {user.role !== "admin" ? (

                  <div className="action-buttons">

                    <button
                      className="approve-btn"
                      onClick={() => handleApprove(user.id)}
                    >
                      Accept
                    </button>

                    <button
                      className="reject-btn"
                      onClick={() => handleReject(user.id)}
                    >
                      Reject
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(user.id, user.role)}
                    >
                      Delete
                    </button>

                  </div>

                ) : (

                  <span className="admin-label">
                    Admin Account
                  </span>

                )}

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}