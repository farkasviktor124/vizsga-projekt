// src/components/Admin.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/admin/users");
      if (!response.ok) throw new Error(`HTTP hiba: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) setUsers(data);
      else setUsers([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const safeJson = async (response) => {
    const text = await response.text();
    try { return JSON.parse(text); }
    catch { return { error: `Szerver hiba (${response.status})` }; }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Biztosan törlöd ezt a felhasználót?")) return;
    try {
      const response = await fetch(`http://localhost:4000/api/admin/users/${id}`, { method: "DELETE" });
      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        const data = await safeJson(response);
        alert(`Hiba: ${data.error || "Ismeretlen hiba"}`);
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
  };

  const toggleUserStatus = async (user) => {
    const newStatus = user.status === "active" ? "banned" : "active";
    try {
      const response = await fetch(`http://localhost:4000/api/admin/users/${user.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      } else {
        const data = await safeJson(response);
        alert(`Hiba: ${data.error || "Ismeretlen hiba"}`);
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
  };

  const toggleUserRole = async (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    if (!window.confirm(`Biztosan ${newRole === "admin" ? "adminná teszed" : "visszaváltod user-ré"} ezt a felhasználót?`)) return;
    try {
      const response = await fetch(`http://localhost:4000/api/admin/users/${user.id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      } else {
        const data = await safeJson(response);
        alert(`Hiba: ${data.error || "Ismeretlen hiba"}`);
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
  };

  if (loading) return <div style={{ padding: "20px", color: "white" }}>Betöltés...</div>;
  if (error) return <div style={{ padding: "20px", color: "red" }}>Hiba: {error}</div>;

  return (
    <div style={{ padding: "20px", color: "white", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ color: "#a0f0ff", marginBottom: "20px" }}>Admin Panel - Felhasználók</h1>
      
      {users.length === 0 ? (
        <p>Nincsenek felhasználók</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
            <thead>
              <tr style={{ background: "#333" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>ID</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Felhasználónév</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
                <th style={{ padding: "12px", textAlign: "center" }}>Szerepkör</th>
                <th style={{ padding: "12px", textAlign: "center" }}>Státusz</th>
                <th style={{ padding: "12px", textAlign: "center" }}>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ 
                  background: u.status === "banned" ? "#2a0000" : "transparent",
                  borderBottom: "1px solid #444"
                }}>
                  <td style={{ padding: "10px" }}>{u.id}</td>
                  <td style={{ padding: "10px" }}><strong>{u.username}</strong></td>
                  <td style={{ padding: "10px" }}>{u.email}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <span style={{
                      background: u.role === "admin" ? "#7c3aed" : "#374151",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px"
                    }}>
                      {u.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <span style={{ color: u.status === "active" ? "#22c55e" : "#ef4444" }}>
                      {u.status === "active" ? "Aktív" : "Letiltva"}
                    </span>
                  </td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <button onClick={() => toggleUserStatus(u)} style={{
                      marginRight: "6px",
                      background: u.status === "active" ? "#dc2626" : "#16a34a",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}>
                      {u.status === "active" ? "Tiltás" : "Engedélyezés"}
                    </button>
                    <button onClick={() => toggleUserRole(u)} style={{
                      marginRight: "6px",
                      background: "#7c3aed",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}>
                      {u.role === "admin" ? "→ User" : "→ Admin"}
                    </button>
                    <button onClick={() => deleteUser(u.id)} style={{
                      background: "transparent",
                      color: "#ef4444",
                      border: "1px solid #ef4444",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}>
                      Törlés
                    </button>
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

export default Admin;