import React, { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { useCart } from "./components/CartContext.jsx"; // ✅ CartContext import
import Termek from "./components/Termek.jsx";
import Admin from "./components/Admin.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import AuthModal from "./components/AuthModal.jsx";
import Home from "./components/Home.jsx";
import TerrmekFelvitel from "./components/TerrmekFelvitel.jsx";
import NavBar from "./components/NavBar.jsx";
import ProductGrid from "./components/ProductGrid.jsx";
import UserSwitch from "./components/UserSwitch.jsx";
import TermekReszletek from "./components/TermekReszletek";
import CartPage from "./components/CartPage";
import "./index.css";

function AppContent() {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // ✅ CartContext használata
  const { cartItems } = useCart();
  const totalCartItems = cartItems?.reduce((sum, item) => sum + (item.quantity ?? 1), 0) ?? 0;

  // Betöltés localStorage-ból
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  function handleLoginSuccess(userData) {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (userData.role === "admin") navigate("/admin");
      else if (userData.role === "seller") navigate("/termekfelvitel");
      else navigate("/");
    }, 1500);
  }

  function handleSwitchUser(newUser) {
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));

    if (newUser.role === "admin") navigate("/admin");
    else if (newUser.role === "seller") navigate("/termekfelvitel");
    else navigate("/");
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <>
      {loading && <LoadingScreen username={user?.username || user?.email || "Vendég"} />}

      <div className="app">
        <header className="header">
          <div className="header-left">
            <h1>RetroGshop</h1>
            <p className="subtitle">A retro és modern technológia találkozása!</p>
          </div>

          <div className="header-right">
            {user ? (
              <UserSwitch
                currentUser={user}
                onSwitchUser={handleSwitchUser}
                onLogout={handleLogout}
              />
            ) : (
              <button className="auth-btn" onClick={() => setModalVisible(true)}>
                Bejelentkezés / Regisztráció
              </button>
            )}
            {/* ✅ Kosár gomb most már mutatja a darabszámot */}
            <button className="cart-btn" onClick={() => navigate("/cart")}>
              Kosár ({totalCartItems})
            </button>
          </div>
        </header>

        <NavBar user={user} />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/termekek" element={<Termek />} />
          <Route path="/termekfelvitel" element={<TerrmekFelvitel />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/termek/:slug" element={<TermekReszletek />} />
          <Route path="/cart" element={<CartPage />} />
        </Routes>

        <AuthModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    </>
  );
}

export default function RetroGshop() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}