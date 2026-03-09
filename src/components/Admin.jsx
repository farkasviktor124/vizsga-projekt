// Admin.jsx - Javított verzió
import React, { useEffect, useState } from "react";

function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Felhasználók lekérése
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/admin/users");
      if (!response.ok) {
        throw new Error(`HTTP hiba: ${response.status}`);
      }
      const data = await response.json();
      console.log("Felhasználók:", data); // Debug
      setUsers(data);
    } catch (err) {
      console.error("Hiba a felhasználók lekérésekor:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Felhasználó törlése
  async function deleteUser(id) {
    if (!window.confirm("Biztosan törlöd ezt a felhasználót?")) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/admin/users/${id}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        const data = await response.json();
        alert(`Hiba: ${data.error || "Ismeretlen hiba"}`);
      }
    } catch (err) {
      console.error("Hiba törléskor:", err);
      alert("Hálózati hiba!");
    }
  }

  // Tiltás / Engedélyezés
  async function toggleUserStatus(user) {
    const newStatus = user.type === "active" ? "banned" : "active";
    
    try {
      const response = await fetch(`http://localhost:4000/api/admin/users/${user.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setUsers(users.map(u => 
          u.id === user.id ? { ...u, type: newStatus } : u
        ));
      } else {
        const data = await response.json();
        alert(`Hiba: ${data.error || "Ismeretlen hiba"}`);
      }
    } catch (err) {
      console.error("Hiba státusz módosításkor:", err);
      alert("Hálózati hiba!");
    }
  }

  if (loading) return <div style={{ padding: "20px", color: "white" }}>Betöltés...</div>;
  if (error) return <div style={{ padding: "20px", color: "red" }}>Hiba: {error}</div>;

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>Admin Panel</h1>
      <p>Felhasználók kezelése</p>

      {users.length === 0 ? (
        <p>Nincsenek felhasználók</p>
      ) : (
        <table border="1" style={{ width: "100%", color: "white", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#333" }}>
              <th>ID</th>
              <th>Név</th>
              <th>Email</th>
              <th>Szerepkör</th>
              <th>Státusz</th>
              <th>Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td style={{ color: u.type === "active" ? "green" : "red" }}>
                  {u.type === "active" ? "Aktív" : "Letiltva"}
                </td>
                <td>
                  <button onClick={() => deleteUser(u.id)} style={{ marginRight: "10px" }}>
                    Törlés
                  </button>
                  <button onClick={() => toggleUserStatus(u)}>
                    {u.type === "active" ? "Tiltás" : "Engedélyezés"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Admin;