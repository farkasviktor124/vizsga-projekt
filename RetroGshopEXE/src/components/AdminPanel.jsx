// src/components/AdminPanel.jsx
import React, { useState, useEffect } from "react";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Hiba a felhasználók lekérésekor:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "banned" : "active";
    try {
      const response = await fetch(`http://localhost:4000/api/admin/users/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Hiba:", error);
    }
  };

  const handleRoleChange = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      const response = await fetch(`http://localhost:4000/api/admin/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Hiba:", error);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Biztosan törlöd ezt a felhasználót?")) {
      try {
        const response = await fetch(`http://localhost:4000/api/admin/users/${id}`, {
          method: "DELETE"
        });
        if (response.ok) {
          fetchUsers();
        }
      } catch (error) {
        console.error("Hiba:", error);
      }
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "50px", color: "#a0f0ff" }}>Betöltés...</div>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "40px auto", padding: "20px" }}>
      <h1 style={{ color: "#a0f0ff", textAlign: "center", marginBottom: "30px" }}>Admin Panel - Felhasználók</h1>
      
      <div style={{ background: "#1a2b3a", border: "1px solid #66f0ff", borderRadius: "12px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#a0f0ff" }}>
          <thead>
            <tr style={{ background: "#0f1b24", borderBottom: "1px solid #66f0ff" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>ID</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Felhasználónév</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Szerepkör</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Státusz</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #2a4a5a" }}>
                <td style={{ padding: "12px" }}>{user.id}</td>
                <td style={{ padding: "12px" }}>{user.username}</td>
                <td style={{ padding: "12px" }}>{user.email}</td>
                <td style={{ padding: "12px" }}>
                  <button
                    onClick={() => handleRoleChange(user.id, user.role)}
                    style={{
                      background: user.role === "admin" ? "#4caf50" : "#7c3aed",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    {user.role === "admin" ? "Admin" : "Felhasználó"}
                  </button>
                </td>
                <td style={{ padding: "12px" }}>
                  <button
                    onClick={() => handleStatusChange(user.id, user.status)}
                    style={{
                      background: user.status === "active" ? "#4caf50" : "#f44336",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    {user.status === "active" ? "Aktív" : "Tiltva"}
                  </button>
                </td>
                <td style={{ padding: "12px" }}>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    style={{
                      background: "#ff6b6b",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Törlés
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;