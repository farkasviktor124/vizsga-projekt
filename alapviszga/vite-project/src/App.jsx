import React, { useState } from "react";
import "./index.css";

// ------------------- AuthModal komponens -------------------
function AuthModal({ visible, onClose }) {
  const [mode, setMode] = useState("login"); // login | register | seller

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const data = {
    type: mode,
    username: formData.get('username') || null,
    email: formData.get('email'),
    password: formData.get('password'),
  };

  try {
    const url = mode === 'login'
      ? 'http://localhost:4000/api/login'
      : 'http://localhost:4000/api/users';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json(); 

    if (result.success) {
      alert(mode === 'login'
        ? 'Sikeres bejelentkezés! ID: ' + result.userId
        : 'Sikeres regisztráció! ID: ' + result.userId
      );
      onClose();
    } else {
      alert('Hiba: ' + result.error);
    }

  } catch (err) {
    console.error(err);
    alert('Hiba a kapcsolat során!');
  }
}



  if (!visible) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal animate-fade-in">
        <button className="modal-close" onClick={onClose}>×</button>

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
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
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
            {mode === "login" ? "Bejelentkezés" : mode === "register" ? "Regisztráció" : "Eladó fiók létrehozása"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 999;
        }
        .modal {
          position: fixed;
          top: 50%;
          left: 50%;
          width: 320px;
          background-color: #111827;
          border-radius: 10px;
          padding: 2rem;
          transform: translate(-50%, -50%);
          color: white;
          z-index: 1000;
          box-shadow: 0 0 20px rgba(0,0,0,0.8);
        }
        .modal-close {
          position: absolute;
          top: 10px;
          right: 15px;
          background: transparent;
          border: none;
          font-size: 1.5rem;
          color: white;
          cursor: pointer;
        }
        .modal-tabs {
          display: flex;
          justify-content: space-around;
          margin-bottom: 1rem;
        }
        .modal-tabs button {
          background: transparent;
          border: 2px solid transparent;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .modal-tabs button:hover,
        .modal-tabs button.active {
          background-color: #1e40af;
          border-color: #2563eb;
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .modal-form input {
          padding: 0.5rem;
          border-radius: 6px;
          border: none;
          font-size: 1rem;
        }
        .modal-form button[type="submit"] {
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 0.75rem;
          font-weight: bold;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .modal-form button[type="submit"]:hover {
          background-color: #1e40af;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -45%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease forwards;
        }
      `}</style>
    </>
  );
}

// ------------------- ProductCard komponens -------------------
function ProductCard({ image, title, price }) {
  return (
    <div className="product-card">
      <div className="image-wrapper">
        <img src={image} alt={title} />
      </div>
      <div className="product-info">
        <h3>{title}</h3>
        <p className="price">{price}</p>
      </div>
    </div>
  );
}

// ------------------- RetroGshop főkomponens -------------------
export default function RetroGshop() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1>RetroGshop</h1>
          <p className="subtitle">A retro és modern technológia találkozása!</p>
          <button className="auth-btn" onClick={() => setModalVisible(true)}>
            Bejelentkezés / Regisztráció
          </button>
        </div>
        <div className="header-right">
          <button className="cart-btn">Kosár (0)</button>
        </div>
      </header>

      {/* Products */}
      <main className="products">
        <ProductCard image="/images/msi-laptop.png" title="MSI Cyborg 15 Gaming Laptop" price="499 990 Ft" />
        <ProductCard image="/images/rtx-4070-ti.png" title="RTX 4070 Ti Super Videókártya" price="249 990 Ft" />
        <ProductCard image="/images/corsair-keyboard.png" title="Corsair Mechanikus billentyűzet" price="39 990 Ft" />
      </main>

      {/* AuthModal */}
      <AuthModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </div>
  );
}
