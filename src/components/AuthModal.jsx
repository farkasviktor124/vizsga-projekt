import React, { useState, useEffect } from "react";


export default function AuthModal({ visible, onClose, onLoginSuccess }) {

  const [mode, setMode] = useState("login"); // login/register/seller/admin
  const [captcha, setCaptcha] = useState(""); // captcha kód
  const [captchaInput, setCaptchaInput] = useState(""); // captcha input


  useEffect(() => {
    if (mode === "admin") {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 5; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      setCaptcha(code);
    }
  }, [mode]); 

  async function handleSubmit(e) {
    e.preventDefault(); 
    const form = e.target;
    const formData = new FormData(form);

   
    if (mode === "admin") {
      const username = formData.get("username");
      const password = formData.get("password");

      
      if (captchaInput !== captcha) {
        alert("Hibás CAPTCHA kód!");
        return;
      }

   
      const response = await fetch("http://localhost:4000/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (result.success) {
        onLoginSuccess("admin", username); // Visszajelzés a szülőnek
        onClose(); // Modal bezárása
      } else {
        alert("Hibás admin adatok!");
      }
      return;
    }

   
    const data = {
      type: mode,
      username: formData.get("username") || null,
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const url =
        mode === "login"
          ? "http://localhost:4000/api/login"
          : "http://localhost:4000/api/users";

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        onLoginSuccess("user", data.username || "Felhasználó");
        onClose();
      } else {
        alert("Hiba: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Hiba a kapcsolat során!");
    }
  }

  
  if (!visible) return null;

  return (
    <>
      {/* Háttér elsötétítés - kattintásra bezár */}
      <div className="modal-overlay" onClick={onClose} />
      
      <div className="modal animate-fade-in">
        {/* Bezáró gomb */}
        <button className="modal-close" onClick={onClose}>×</button>

        {/* Fülek a módok között */}
        <div className="modal-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Bejelentkezés
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Regisztráció
          </button>
          <button className={mode === "seller" ? "active" : ""} onClick={() => setMode("seller")}>
            Eladó fiók
          </button>
          <button className={mode === "admin" ? "active" : ""} onClick={() => setMode("admin")}>
            Admin
          </button>
        </div>

        {/* Űrlap - a mode-tól függően más inputok jelennek meg */}
        <form className="modal-form" onSubmit={handleSubmit}>
          {/* Admin mód */}
          {mode === "admin" && (
            <>
              <input name="username" type="text" placeholder="Admin" required />
              <input name="password" type="password" placeholder="Jelszó" required />

              {/* Captcha mezők 
              <div className="captcha-box">
                <div className="captcha-code">{captcha}</div>
                <input
                  type="text"
                  placeholder="Írd be a kódot"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  required
                />
              </div>

              <button type="submit">Admin bejelentkezés</button>
              */}
            </>
          )}

          {/* Nem admin módok */}
          {mode !== "admin" && (
            <>
              {mode !== "login" && (
                <input
                  name="username"
                  type="text"
                  placeholder={mode === "seller" ? "Eladó név" : "Felhasználónév"}
                  required
                />
              )}
              <input name="email" type="email" placeholder="Email" required />
              <input name="password" type="password" placeholder="Jelszó" required />
              <button type="submit">
                {mode === "login"
                  ? "Bejelentkezés"
                  : mode === "register"
                  ? "Regisztráció"
                  : "Eladó fiók létrehozása"}
              </button>
            </>
          )}
        </form>
      </div>
    </>
  );
}