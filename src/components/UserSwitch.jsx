import React, { useState, useEffect } from 'react';

export default function UserSwitch({ currentUser, onSwitchUser, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  // Összes felhasználó betöltése (csak adminnak)
  useEffect(() => {
    if (isOpen && currentUser?.role === 'admin') {
      fetchAllUsers();
    }
  }, [isOpen, currentUser]);

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/users');
      const data = await response.json();
      // Kiszűrjük a jelenlegi felhasználót
      setAllUsers(data.filter(u => u.id !== currentUser?.id));
    } catch (err) {
      console.error('Hiba a felhasználók betöltésekor:', err);
    }
  };

  // Badge és szín szerepkör alapján - JAVÍTVA!
  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return { icon: '👑', color: '#ff6b6b', text: 'Admin' };
      case 'seller': return { icon: '🛒', color: '#4ecdc4', text: 'Eladó' };
      case 'user': return { icon: '🛍️', color: '#45b7d1', text: 'Vásárló' };
      default: return { icon: '👤', color: '#66f0ff', text: 'Ismeretlen' };
    }
  };

  // Jelszó ellenőrzés váltáskor
  const handleSwitchClick = (user) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
    setPassword('');
    setError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: selectedUser.email, 
          password: password 
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onSwitchUser(selectedUser);
        setShowPasswordModal(false);
        setIsOpen(false);
      } else {
        setError('Hibás jelszó!');
      }
    } catch (err) {
      setError('Hálózati hiba!');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  const currentBadge = getRoleBadge(currentUser.role);

  return (
    <div className="user-switch-container">
      {/* Profilkép és név */}
      <div className="user-profile" onClick={() => setIsOpen(!isOpen)}>
        <div className="user-avatar" style={{ background: currentBadge.color }}>
          {currentBadge.icon}
        </div>
        <div className="user-info">
          <span className="user-name">{currentUser.username || currentUser.email}</span>
          <span className="user-role">{currentBadge.text}</span>
        </div>
        <div className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</div>
      </div>

      {/* ADMIN DROPDOWN */}
      {isOpen && currentUser.role === 'admin' && (
        <>
          <div className="dropdown-overlay" onClick={() => setIsOpen(false)} />
          <div className="user-dropdown admin-dropdown">
            <div className="dropdown-header">
              <span className="dropdown-title">👑 Admin Fiókváltó</span>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {/* Aktív admin */}
            <div className="current-account">
              <div className="account-item active">
                <div className="account-avatar" style={{ background: '#ff6b6b' }}>
                  👑
                </div>
                <div className="account-details">
                  <span className="account-name">{currentUser.username || currentUser.email}</span>
                  <span className="account-email">{currentUser.email}</span>
                  <span className="account-badge" style={{ background: '#ff6b6b20', color: '#ff6b6b' }}>
                    👑 Aktív admin
                  </span>
                </div>
              </div>
            </div>

            {/* Összes többi felhasználó */}
            {allUsers.length > 0 ? (
              <div className="all-users">
                <div className="dropdown-subtitle">📋 Összes felhasználó ({allUsers.length})</div>
                {allUsers.map(user => {
                  const badge = getRoleBadge(user.role);
                  return (
                    <div 
                      key={user.id} 
                      className="account-item"
                      onClick={() => handleSwitchClick(user)}
                    >
                      <div className="account-avatar" style={{ background: badge.color }}>
                        {badge.icon}
                      </div>
                      <div className="account-details">
                        <span className="account-name">{user.username || user.email}</span>
                        <span className="account-email">{user.email}</span>
                        <span className="account-role" style={{ background: `${badge.color}20`, color: badge.color }}>
                          {badge.icon} {badge.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-users">
                <p>Nincs más felhasználó</p>
              </div>
            )}

            <div className="dropdown-footer">
              <button className="logout-btn" onClick={onLogout}>
                🚪 Kijelentkezés
              </button>
            </div>
          </div>
        </>
      )}

      {/* ELADÓ DROPDOWN */}
      {isOpen && currentUser.role === 'seller' && (
        <>
          <div className="dropdown-overlay" onClick={() => setIsOpen(false)} />
          <div className="user-dropdown seller-dropdown">
            <div className="dropdown-header">
              <span className="dropdown-title">🛒 Eladó profil</span>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="current-account">
              <div className="account-item active">
                <div className="account-avatar" style={{ background: '#4ecdc4' }}>
                  🛒
                </div>
                <div className="account-details">
                  <span className="account-name">{currentUser.username || currentUser.email}</span>
                  <span className="account-email">{currentUser.email}</span>
                  <span className="account-badge" style={{ background: '#4ecdc420', color: '#4ecdc4' }}>
                    🛒 Eladó
                  </span>
                </div>
              </div>
            </div>

            <div className="no-permission">
              <p>🔒 Nincs jogosultságod más felhasználók látásához</p>
            </div>

            <div className="dropdown-footer">
              <button className="logout-btn" onClick={onLogout}>
                🚪 Kijelentkezés
              </button>
            </div>
          </div>
        </>
      )}

      {/* VÁSÁRLÓ DROPDOWN */}
      {isOpen && currentUser.role === 'user' && (
        <>
          <div className="dropdown-overlay" onClick={() => setIsOpen(false)} />
          <div className="user-dropdown user-dropdown">
            <div className="dropdown-header">
              <span className="dropdown-title">🛍️ Vásárló profil</span>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="current-account">
              <div className="account-item active">
                <div className="account-avatar" style={{ background: '#45b7d1' }}>
                  🛍️
                </div>
                <div className="account-details">
                  <span className="account-name">{currentUser.username || currentUser.email}</span>
                  <span className="account-email">{currentUser.email}</span>
                  <span className="account-badge" style={{ background: '#45b7d120', color: '#45b7d1' }}>
                    🛍️ Vásárló
                  </span>
                </div>
              </div>
            </div>

            <div className="no-permission">
              <p>🔒 Nincs jogosultságod más felhasználók látásához</p>
            </div>

            <div className="dropdown-footer">
              <button className="logout-btn" onClick={onLogout}>
                🚪 Kijelentkezés
              </button>
            </div>
          </div>
        </>
      )}

      {/* Jelszó modal */}
      {showPasswordModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)} />
          <div className="password-modal">
            <h3>🔐 Jelszó ellenőrzés</h3>
            <p>Add meg a jelszót a váltáshoz:</p>
            <p className="user-email">{selectedUser?.email}</p>
            
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                placeholder="Jelszó"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
              
              {error && <div className="error-message">{error}</div>}
              
              <div className="modal-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? '...' : 'Váltás'}
                </button>
                <button type="button" onClick={() => setShowPasswordModal(false)}>
                  Mégsem
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}