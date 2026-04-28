// src/components/Admin.jsx
import React, { useEffect, useState, useRef } from "react";
import "./Admin.css";

function Admin() {
  const [users, setUsers] = useState([]);
  const [fizetesek, setFizetesek] = useState([]);
  const [rendelesek, setRendelesek] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("rendelesek");
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [orderNotifications, setOrderNotifications] = useState([]);
  const [systemNotifyCount, setSystemNotifyCount] = useState(0);
  const [orderNotifyCount, setOrderNotifyCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationTimeoutRef = useRef(null);

  useEffect(() => {
    fetchUsers();
    fetchFizetesek();
    fetchRendelesek();
    startPolling();
    return () => {
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/admin/users");
      if (!response.ok) throw new Error(`HTTP hiba: ${response.status}`);
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFizetesek = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/admin/fizetesek");
      if (response.ok) {
        const data = await response.json();
        setFizetesek(data);
      }
    } catch (err) {
      addSystemNotification(`⚠️ Fizetések lekérése sikertelen`, "error");
    }
  };

  const fetchRendelesek = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/rendelesek");
      if (response.ok) {
        const data = await response.json();
        setRendelesek(data);
        checkNewOrders(data);
        return data;
      }
    } catch (err) {
      addSystemNotification(`⚠️ Rendelések lekérése sikertelen`, "error");
    }
    return [];
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 300);
    } catch (e) {}
  };

  const addSystemNotification = (message, type = "info") => {
    const newNotification = { id: Date.now(), message, time: new Date().toLocaleTimeString(), type };
    setSystemNotifications(prev => [newNotification, ...prev]);
    setSystemNotifyCount(prev => prev + 1);
    playNotificationSound();
    setTimeout(() => {
      setSystemNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      setSystemNotifyCount(prev => Math.max(0, prev - 1));
    }, 5000);
  };

  const addOrderNotification = (message, type = "new_order") => {
    const newNotification = { id: Date.now(), message, time: new Date().toLocaleTimeString(), type };
    setOrderNotifications(prev => [newNotification, ...prev]);
    setOrderNotifyCount(prev => prev + 1);
    playNotificationSound();
    setTimeout(() => {
      setOrderNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      setOrderNotifyCount(prev => Math.max(0, prev - 1));
    }, 5000);
  };

  const checkNewOrders = (orders) => {
    const savedOrders = localStorage.getItem("lastOrderIds");
    const lastOrderIds = savedOrders ? JSON.parse(savedOrders) : [];
    const newOrders = orders.filter(order => !lastOrderIds.includes(order.id));
    
    if (newOrders.length > 0) {
      newOrders.forEach(order => {
        addOrderNotification(`📦 Új rendelés! #${order.rendeles_szam} - ${order.vegosszeg?.toLocaleString()} Ft`, "new_order");
      });
      const newOrderIds = orders.map(o => o.id);
      localStorage.setItem("lastOrderIds", JSON.stringify(newOrderIds));
    }
  };

  const startPolling = () => {
    setInterval(() => {
      fetchRendelesek();
      fetchFizetesek();
    }, 30000);
  };

  const getStatusText = (status) => {
    const texts = {
      'fizetes_folyamatban': 'Fizetés alatt', 'fizetve': 'Fizetve',
      'feldolgozas_alatt': 'Feldolgozás alatt', 'szallitva': 'Szállítva',
      'teljesitve': 'Teljesítve', 'torolve': 'Törölve'
    };
    return texts[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      'fizetes_folyamatban': 'status-fizetes_folyamatban', 'fizetve': 'status-fizetve',
      'feldolgozas_alatt': 'status-feldolgozas_alatt', 'szallitva': 'status-szallitva',
      'teljesitve': 'status-teljesitve', 'torolve': 'status-torolve'
    };
    return classes[status] || 'status-fizetes_folyamatban';
  };

  // STÁTUSZ MÓDOSÍTÁS - ITT TÖRTÉNIK A FRISSÍTÉS
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log(`🔄 Státusz módosítás: ${orderId} -> ${newStatus}`);
      
      const response = await fetch(`http://localhost:4000/api/rendeles/${orderId}/statusz`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusz: newStatus })
      });
      
      const data = await response.json();
      console.log("Backend válasz:", data);
      
      if (response.ok && data.success) {
        // Újratöltjük a rendeléseket a frissített státusszal
        const updatedOrders = await fetchRendelesek();
        setRendelesek(updatedOrders);
        addSystemNotification(`✅ Rendelés #${orderId} státusz módosítva: ${getStatusText(newStatus)}`, "status_change");
      } else {
        addSystemNotification(`❌ Hiba a rendelés #${orderId} módosításakor: ${data.error || "Ismeretlen hiba"}`, "error");
      }
    } catch (err) {
      console.error("Hálózati hiba:", err);
      addSystemNotification(`❌ Hálózati hiba a rendelés módosításakor!`, "error");
    }
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm("Biztosan törölni szeretnéd ezt a rendelést?")) {
      await updateOrderStatus(orderId, "torolve");
    }
  };

  const approveOrder = async (orderId) => {
    await updateOrderStatus(orderId, "fizetve");
  };

  if (loading) return <div className="loading">⏳ Betöltés...</div>;
  if (error) return <div className="error">❌ Hiba: {error}</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">🎮 Admin Panel - RETROGSHOP</h1>
        
        <div className="bell-container" onClick={() => setShowNotifications(!showNotifications)}>
          <div className="bell-icon">🔔</div>
          {(systemNotifyCount + orderNotifyCount) > 0 && (
            <div className="bell-badge">{systemNotifyCount + orderNotifyCount}</div>
          )}
        </div>
      </div>
      
      {showNotifications && (
        <div className="notification-panel">
          <div className="notification-header">📢 Értesítések</div>
          
          <div className="notification-section">
            <div className="section-title">🖥️ Rendszer műveletek ({systemNotifications.length})</div>
            <div className="notification-list">
              {systemNotifications.length === 0 ? (
                <div className="no-notifications"><span>🔧</span><p>Nincsenek rendszer értesítések</p></div>
              ) : (
                systemNotifications.map((ert, idx) => (
                  <div key={idx} className={`notification-item ${ert.type}`}>
                    <div className="notification-message">{ert.message}</div>
                    <div className="notification-time">🕐 {ert.time}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="notification-section">
            <div className="section-title">📦 Beérkező rendelések ({orderNotifications.length})</div>
            <div className="notification-list">
              {orderNotifications.length === 0 ? (
                <div className="no-notifications"><span>📭</span><p>Nincsenek új rendelések</p></div>
              ) : (
                orderNotifications.map((ert, idx) => (
                  <div key={idx} className={`notification-item ${ert.type}`}>
                    <div className="notification-message">{ert.message}</div>
                    <div className="notification-time">🕐 {ert.time}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="notification-footer">
            <button className="clear-all-btn" onClick={() => { 
              setSystemNotifications([]); setOrderNotifications([]);
              setSystemNotifyCount(0); setOrderNotifyCount(0);
            }}>🗑️ Összes törlése</button>
          </div>
        </div>
      )}
      
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === "rendelesek" ? "active" : ""}`} onClick={() => setActiveTab("rendelesek")}>
          📦 Rendelések ({rendelesek.length})
        </button>
        <button className={`tab-btn ${activeTab === "fizetesek" ? "active" : ""}`} onClick={() => setActiveTab("fizetesek")}>
          💰 Fizetések ({fizetesek.length})
        </button>
        <button className={`tab-btn ${activeTab === "felhasznalok" ? "active" : ""}`} onClick={() => setActiveTab("felhasznalok")}>
          👥 Felhasználók ({users.length})
        </button>
      </div>
      
      {activeTab === "rendelesek" && (
        <div className="table-container">
          <h2 className="section-title">📦 Rendelések ({rendelesek.length})</h2>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Rendelésszám</th><th>Összeg</th><th>Szállítás</th><th>Fizetés</th><th>Státusz</th><th>Műveletek</th></tr>
              </thead>
              <tbody>
                {rendelesek.map((order, idx) => (
                  <tr key={order.id}>
                    <td data-label="#">{idx + 1}.</td>
                    <td data-label="Rendelésszám">{order.rendeles_szam}</td>
                    <td data-label="Összeg">{order.vegosszeg?.toLocaleString()} Ft</td>
                    <td data-label="Szállítás">{order.szallitas_mod}</td>
                    <td data-label="Fizetés">
                      {order.fizetes_statusz === 'fuggo' ? '⏳ Függőben' : order.fizetes_statusz === 'fizetve' ? '✅ Fizetve' : '❓ Ismeretlen'}
                    </td>
                    <td data-label="Státusz">
                      <span className={`status-badge ${getStatusClass(order.statusz)}`}>
                        {getStatusText(order.statusz)}
                      </span>
                    </td>
                    <td data-label="Műveletek" className="actions-cell">
                      <button className="action-btn btn-approve" onClick={() => approveOrder(order.id)}>✅ Jóváhagy</button>
                      <button className="action-btn btn-process" onClick={() => updateOrderStatus(order.id, "feldolgozas_alatt")}>⚙️ Feldolgoz</button>
                      <button className="action-btn btn-ship" onClick={() => updateOrderStatus(order.id, "szallitva")}>🚚 Szállít</button>
                      <button className="action-btn btn-complete" onClick={() => updateOrderStatus(order.id, "teljesitve")}>🎯 Teljesít</button>
                      <button className="action-btn btn-delete" onClick={() => deleteOrder(order.id)}>🗑️ Töröl</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === "fizetesek" && (
        <div className="table-container">
          <h2 className="section-title">💰 Fizetések ({fizetesek.length})</h2>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead><tr><th>#</th><th>Rendelésszám</th><th>Fizetési mód</th><th>Összeg</th><th>Státusz</th><th>Dátum</th></tr></thead>
              <tbody>
                {fizetesek.map((fiz, idx) => (
                  <tr key={fiz.id}>
                    <td data-label="#">{idx + 1}.</td>
                    <td data-label="Rendelésszám">{fiz.rendeles_szam}</td>
                    <td data-label="Fizetési mód">
                      {fiz.fizetes_mod === "bankkartya" ? "💳 Bankkártya" : fiz.fizetes_mod === "atutalas" ? "🏦 Átutalás" : "📦 Utánvétel"}
                    </td>
                    <td data-label="Összeg">{fiz.fizetes_osszeg?.toLocaleString()} Ft</td>
                    <td data-label="Státusz">
                      <span className={`status-badge ${fiz.statusz === 'fizetve' ? 'status-fizetve' : 'status-fizetes_folyamatban'}`}>
                        {fiz.statusz === 'fizetve' ? '✅ Fizetve' : '⏳ Függőben'}
                      </span>
                    </td>
                    <td data-label="Dátum">{new Date(fiz.letrehozva).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === "felhasznalok" && (
        <div className="table-container">
          <h2 className="section-title">👥 Felhasználók ({users.length})</h2>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead><tr><th>#</th><th>Felhasználónév</th><th>Email</th><th>Szerepkör</th><th>Státusz</th><th>Műveletek</th></tr></thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.id}>
                    <td data-label="#">{idx + 1}.</td>
                    <td data-label="Felhasználónév">{user.username}</td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Szerepkör">{user.role === 'admin' ? '👑 Admin' : '👤 User'}</td>
                    <td data-label="Státusz">
                      <span className={`status-badge ${user.status === 'active' ? 'status-fizetve' : 'status-torolve'}`}>
                        {user.status === 'active' ? '✅ Aktív' : '🔨 Tiltva'}
                      </span>
                    </td>
                    <td data-label="Műveletek" className="actions-cell">
                      {user.status === 'active' ? (
                        <button className="action-btn btn-ban" onClick={async () => {
                          if (window.confirm(`Tiltod ${user.username}?`)) {
                            const res = await fetch(`http://localhost:4000/api/admin/users/${user.id}/status`, {
                              method: "PUT", headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: "banned" })
                            });
                            if (res.ok) { fetchUsers(); addSystemNotification(`🔨 ${user.username} tiltva`, "ban"); }
                          }
                        }}>🔨 Tiltás</button>
                      ) : (
                        <button className="action-btn btn-unban" onClick={async () => {
                          const res = await fetch(`http://localhost:4000/api/admin/users/${user.id}/status`, {
                            method: "PUT", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "active" })
                          });
                          if (res.ok) { fetchUsers(); addSystemNotification(`🔓 ${user.username} feloldva`, "unban"); }
                        }}>🔓 Feloldás</button>
                      )}
                      <button className="action-btn btn-delete" onClick={async () => {
                        if (window.confirm(`Törlöd ${user.username}?`)) {
                          const res = await fetch(`http://localhost:4000/api/admin/users/${user.id}`, { method: "DELETE" });
                          if (res.ok) { fetchUsers(); addSystemNotification(`🗑️ ${user.username} törölve`, "delete"); }
                        }
                      }}>🗑️ Törlés</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;