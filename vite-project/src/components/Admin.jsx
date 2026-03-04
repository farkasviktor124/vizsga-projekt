import React, { useEffect, useState } from "react";

function Admin() {
  const [users, setUsers] = useState([]);

  // Felhasználók lekérése
  useEffect(() => {
    fetch("http://localhost:4000/api/admin/users")
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Hiba a felhasználók lekérésekor:", err));
  }, []);

  // Felhasználó törlése
  function deleteUser(id) {
    fetch(`http://localhost:4000/api/admin/users/${id}`, {
      method: "DELETE"
    })
      .then(() => {
        setUsers(users.filter(u => u.id !== id));
      })
      .catch(err => console.error("Hiba törléskor:", err));
  }

  // Tiltás
  function banUser(id) {
    fetch(`http://localhost:4000/api/admin/users/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "banned" })
    })
      .then(() => {
        setUsers(users.map(u => u.id === id ? { ...u, type: "banned" } : u));
      })
      .catch(err => console.error("Hiba tiltáskor:", err));
  }

  // Engedélyezés
  function unbanUser(id) {
    fetch(`http://localhost:4000/api/admin/users/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" })
    })
      .then(() => {
        setUsers(users.map(u => u.id === id ? { ...u, type: "active" } : u));
      })
      .catch(err => console.error("Hiba engedélyezéskor:", err));
  }

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>Admin Panel</h1>
      <p>Felhasználók kezelése</p>

      <table border="1" style={{ width: "100%", color: "white", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#333" }}>
            <th>ID</th>
            <th>Név</th>
            <th>Email</th>
            <th>Típus</th>
            <th>Műveletek</th>
          </tr>
        </thead>

        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.type}</td>
              <td>
                <button onClick={() => deleteUser(u.id)} style={{ marginRight: "10px" }}>
                  Törlés
                </button>
                <button onClick={() => banUser(u.id)} style={{ marginRight: "10px" }}>
                  Tiltás
                </button>
                <button onClick={() => unbanUser(u.id)}>
                  Engedélyezés
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Admin;