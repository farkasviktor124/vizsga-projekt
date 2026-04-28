import React, { useState } from "react";

export default function AuthModal({ visible, onClose, onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // login/register
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    
    const form = e.target;
    const formData = new FormData(form);
    const email = formData.get("email");
    const password = formData.get("password");
    const username = formData.get("username");

    try {
      // BEJELENTKEZÉS
      if (mode === "login") {
        const response = await fetch("http://localhost:4000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          localStorage.setItem('token', result.token);
          localStorage.setItem('user', JSON.stringify(result.user));
          onLoginSuccess(result.user);
          onClose();
        } else {
          alert(" " + (result.error || "Hibás bejelentkezési adatok!"));
        }
      } 
      
      // REGISZTRÁCIÓ
      else if (mode === "register") {
        const response = await fetch("http://localhost:4000/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            username, 
            email,
            password,
            role: 'user' 
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          alert(" Sikeres regisztráció! Most jelentkezz be.");
          setMode("login");
        } else {
          alert(" " + (result.error || "Hiba a regisztráció során!"));
        }
      }
    } catch (err) {
      console.error(err);
      alert(" Hálózati hiba! Ellenőrizd, hogy fut-e a backend (http://localhost:4000)");
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      
      <div className="modal">
        <button className="modal-close" onClick={onClose}>×</button>

        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
          {mode === "login" ? " Bejelentkezés" : " Regisztráció"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Regisztrációnál név mező */}
          {mode === "register" && (
            <input
              name="username"
              type="text"
              placeholder="Felhasználónév"
              required
              autoFocus
            />
          )}

          {/* Email cím */}
          <input
            name="email"
            type="email"
            placeholder="Email cím"
            required
            autoFocus={mode === "login"}
          />

          {/* Jelszó */}
          <input
            name="password"
            type="password"
            placeholder="Jelszó"
            required
            minLength={mode === "register" ? "6" : undefined}
          />

          {/* Gombok */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" disabled={loading} style={{ flex: 2 }}>
              {loading ? "..." : (mode === "login" ? "Bejelentkezés" : "Regisztráció")}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1 }}>
              Mégsem
            </button>
          </div>
        </form>

        {/* Váltás bejelentkezés/regisztráció között */}
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <button 
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            style={{ 
              background: 'transparent',
              border: '1px solid #66f0ff',
              width: '100%'
            }}
          >
            {mode === "login" 
              ? "➡️ Nincs még fiókod? Regisztrálj!" 
              : "⬅️ Van már fiókod? Jelentkezz be!"}
          </button>
        </div>

        {/* Teszt admin info */}
        <div style={{ 
          marginTop: '15px', 
          fontSize: '8px', 
          textAlign: 'center',
          color: '#66f0ff',
          borderTop: '1px solid #66f0ff',
          paddingTop: '10px'
        }}>
          Teszt admin: admin@admin.com / admin123
        </div>
      </div>
    </>
  );
}