import React, { useState, useEffect } from "react";
import "./Admin.css";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("rendelesek");
  const [rendelesek, setRendelesek] = useState([]);
  const [fizetesek, setFizetesek] = useState([]);
  const [felhasznalok, setFelhasznalok] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Betöltés
  useEffect(() => {
    betoltRendelesek();
    betoltFizetesek();
    betoltFelhasznalokat();
  }, []);

  const betoltRendelesek = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/rendelesek");
      const adat = await res.json();
      setRendelesek(adat);
    } catch (err) {
      console.error("Hiba:", err);
    } finally {
      setLoading(false);
    }
  };

  const betoltFizetesek = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/admin/fizetesek");
      const adat = await res.json();
      setFizetesek(adat);
    } catch (err) {
      console.error("Hiba:", err);
    }
  };

const betoltFelhasznalokat = async () => {
  try {
    const res = await fetch("http://localhost:4000/api/admin/users");
    const adat = await res.json();
    console.log("Betöltött felhasználók:", adat);
    setFelhasznalok(adat);
  } catch (err) {
    console.error("Hiba a felhasználók betöltésekor:", err);
  }
};

  const statuszValtoztatas = async (id, statusz) => {
    try {
      await fetch(`http://localhost:4000/api/rendeles/${id}/statusz`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusz })
      });
      betoltRendelesek();
      addNotification(`Rendelés #${id} státusz: ${statusz}`, "status_change");
    } catch (err) {
      console.error("Hiba:", err);
    }
  };

  const tiltas = async (id, status) => {
    const ujStatus = status === "active" ? "banned" : "active";
    try {
      await fetch(`http://localhost:4000/api/admin/users/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: ujStatus })
      });
      betoltFelhasznalokat();
      addNotification(`Felhasználó ${ujStatus === "banned" ? "tiltva" : "feloldva"}`, ujStatus === "banned" ? "ban" : "unban");
    } catch (err) {
      console.error("Hiba:", err);
    }
  };

  const torles = async (id, nev) => {
    if (window.confirm(`Biztosan törlöd ${nev} felhasználót?`)) {
      try {
        await fetch(`http://localhost:4000/api/admin/users/${id}`, {
          method: "DELETE"
        });
        betoltFelhasznalokat();
        addNotification(`${nev} törölve`, "delete");
      } catch (err) {
        console.error("Hiba:", err);
      }
    }
  };

  const szerepValtoztatas = async (id, role) => {
    try {
      await fetch(`http://localhost:4000/api/admin/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      betoltFelhasznalokat();
      addNotification(`Szerepkör módosítva: ${role}`, "status_change");
    } catch (err) {
      console.error("Hiba:", err);
    }
  };

  const addNotification = (message, type) => {
    const uj = {
      id: Date.now(),
      message,
      type,
      time: new Date().toLocaleTimeString()
    };
    setNotifications([uj, ...notifications]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== uj.id));
    }, 5000);
  };

  const getStatusClass = (statusz) => {
    const classes = {
      'fizetes_folyamatban': 'status-fizetes_folyamatban',
      'fizetve': 'status-fizetve',
      'feldolgozas_alatt': 'status-feldolgozas_alatt',
      'szallitva': 'status-szallitva',
      'teljesitve': 'status-teljesitve',
      'torolve': 'status-torolve'
    };
    return classes[statusz] || 'status-fizetes_folyamatban';
  };

  const getStatusText = (statusz) => {
    const texts = {
      'fizetes_folyamatban': 'Fizetés alatt',
      'fizetve': 'Fizetve',
      'feldolgozas_alatt': 'Feldolgozás alatt',
      'szallitva': 'Szállítva',
      'teljesitve': 'Teljesítve',
      'torolve': 'Törölve'
    };
    return texts[statusz] || statusz;
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Admin Panel - RETROGShop</h1>
        <div className="bell-container" onClick={() => setShowNotifications(!showNotifications)}>
          <div className="bell-icon">🔔</div>
          {notifications.length > 0 && <div className="bell-badge">{notifications.length}</div>}
          {showNotifications && (
            <div className="notification-panel">
              <div className="notification-header">
                <span>Értesítések</span>
                <span className="notification-count">{notifications.length} új</span>
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <span>🔔</span>
                    <p>Nincs új értesítés</p>
                    <small>Minden rendben!</small>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`notification-item ${n.type}`}>
                      <div className="notification-message">{n.message}</div>
                      <div className="notification-time">{n.time}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="notification-footer">
                <button className="clear-all-btn" onClick={() => setNotifications([])}>
                  Összes törlése
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="admin-stats">
        <div className="stat-card">📦 Rendelések ({rendelesek.length})</div>
        <div className="stat-card">💰 Fizetések ({fizetesek.length})</div>
        <div className="stat-card">👥 Felhasználók ({felhasznalok.length})</div>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === "rendelesek" ? "active" : ""}`} onClick={() => setActiveTab("rendelesek")}>
          📋 Rendelések
        </button>
        <button className={`tab-btn ${activeTab === "fizetesek" ? "active" : ""}`} onClick={() => setActiveTab("fizetesek")}>
          💳 Fizetések
        </button>
        <button className={`tab-btn ${activeTab === "felhasznalok" ? "active" : ""}`} onClick={() => setActiveTab("felhasznalok")}>
          👥 Felhasználók
        </button>
      </div>

      {/* RENDELÉSEK */}
      {activeTab === "rendelesek" && (
        <div className="table-container">
          <h3 className="section-title">📋 Rendelések listája</h3>
          {loading ? (
            <div className="loading">Betöltés...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Rendelésszám</th>
                  <th>Összeg</th>
                  <th>Státusz</th>
                  <th>Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {rendelesek.map((r, i) => (
                  <tr key={r.id}>
                    <td data-label="#">{i+1}</td>
                    <td data-label="Rendelésszám">{r.rendeles_szam}</td>
                    <td data-label="Összeg">{r.vegosszeg?.toLocaleString()} Ft</td>
                    <td data-label="Státusz">
                      <span className={`status-badge ${getStatusClass(r.statusz)}`}>
                        {getStatusText(r.statusz)}
                      </span>
                    </td>
                    <td data-label="Műveletek" className="actions-cell">
                      <button className="action-btn btn-approve" onClick={() => statuszValtoztatas(r.id, "fizetve")}>
                        ✅ Jóváhagy
                      </button>
                      <button className="action-btn btn-process" onClick={() => statuszValtoztatas(r.id, "feldolgozas_alatt")}>
                        ⚙️ Feldolgoz
                      </button>
                      <button className="action-btn btn-ship" onClick={() => statuszValtoztatas(r.id, "szallitva")}>
                        🚚 Szállít
                      </button>
                      <button className="action-btn btn-complete" onClick={() => statuszValtoztatas(r.id, "teljesitve")}>
                        ✅ Teljesít
                      </button>
                      <button className="action-btn btn-delete" onClick={() => statuszValtoztatas(r.id, "torolve")}>
                        🗑️ Töröl
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* FIZETÉSEK */}
      {activeTab === "fizetesek" && (
        <div className="table-container">
          <h3 className="section-title">💰 Fizetések listája</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fizetés ID</th>
                <th>Rendelés</th>
                <th>Összeg</th>
                <th>Mód</th>
                <th>Státusz</th>
              </tr>
            </thead>
            <tbody>
              {fizetesek.map((f, i) => (
                <tr key={f.id}>
                  <td data-label="#">{i+1}</td>
                  <td data-label="Fizetés ID">{f.fizetes_id}</td>
                  <td data-label="Rendelés">{f.rendeles_szam}</td>
                  <td data-label="Összeg">{f.fizetes_osszeg?.toLocaleString()} Ft</td>
                  <td data-label="Mód">{f.fizetes_mod}</td>
                  <td data-label="Státusz">
                    <span className={`status-badge ${f.statusz === "fizetve" ? "status-fizetve" : "status-fizetes_folyamatban"}`}>
                      {f.statusz === "fizetve" ? "✅ Fizetve" : "⏳ Függőben"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FELHASZNÁLÓK */}
      {activeTab === "felhasznalok" && (
        <div className="table-container">
          <h3 className="section-title">👥 Felhasználók listája</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Felhasználónév</th>
                <th>Email</th>
                <th>Szerepkör</th>
                <th>Státusz</th>
                <th>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {felhasznalok.map((user, i) => (
                <tr key={user.id}>
                  <td data-label="#">{i+1}</td>
                  <td data-label="Felhasználónév">{user.username}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Szerepkör">
                    <select 
                      value={user.role} 
                      onChange={(e) => szerepValtoztatas(user.id, e.target.value)}
                      style={{
                        background: "#1a2b3a",
                        border: "1px solid #66f0ff",
                        color: "#a0f0ff",
                        padding: "5px 10px",
                        borderRadius: "5px"
                      }}
                    >
                      <option value="user">👤 Vásárló</option>
                      <option value="admin">👑 Admin</option>
                    </select>
                  </td>
                  <td data-label="Státusz">
                    <span className={`status-badge ${user.status === "active" ? "status-fizetve" : "status-torolve"}`}>
                      {user.status === "active" ? "🟢 Aktív" : "🔴 Tiltva"}
                    </span>
                  </td>
                  <td data-label="Műveletek" className="actions-cell">
                    <button 
                      className={`action-btn ${user.status === "active" ? "btn-ban" : "btn-unban"}`}
                      onClick={() => tiltas(user.id, user.status)}
                    >
                      {user.status === "active" ? "⛔ Tiltás" : "✅ Feloldás"}
                    </button>
                    <button 
                      className="action-btn btn-delete"
                      onClick={() => torles(user.id, user.username)}
                    >
                      🗑️ Törlés
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
};

export default Admin;