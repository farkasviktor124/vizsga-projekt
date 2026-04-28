import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "./components/CartContext";
import NavBar from "./components/NavBar";
import Home from "./components/Home";
import Termekek from "./components/Termekek";
import TermekFelvitel from "./components/TermekFelvitel";
import TermekReszletek from "./components/TermekReszletek";
import CartPage from "./components/CartPage";
import Login from "./components/Login";
import Register from "./components/Register";
import Admin from "./components/Admin";
import Admintermek from "./components/Admintermek";
import Kapcsolat from "./components/Kapcsolat";
import Bejelentes from "./components/Bejelentes";
import Garancia from "./components/Garancia";
import AnyakTorvenyek from "./components/AnyakTorvenyek";
import UserSwitch from "./components/UserSwitch";
import AuthModal from "./components/AuthModal";
import LoadingScreen from "./components/LoadingScreen";
import { CartProvider } from "./components/CartContext";
import Rendeles from "./components/Rendeles";
import Fizetes from "./components/Fizetes";
import RendelesFix from "./components/RendelesFix";
import BarionPayment from "./components/BarionPayment";
import LOGO from "./components/LOGO/LOGO.png"; 
import "./App.css";

function AppContent() {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const totalCartItems = cartItems?.reduce((sum, item) => sum + (item.quantity ?? 1), 0) ?? 0;

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
      else navigate("/");
    }, 1500);
  }

  function handleSwitchUser(newUser) {
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    if (newUser.role === "admin") navigate("/admin");
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
        {/* Fejléc */}
        <header className="header">
         
              <img src={LOGO} alt="" className="logo-image" />
                 <h1>RetroGshop (TM)</h1>
                 <p className="subtitle">A retro és modern technológia találkozása!</p>
                
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
            <button className="cart-btn" onClick={() => navigate("/kosar")}>
              🛒 Kosár ({totalCartItems})
            </button>
          </div>
        </header>

        {/* NavBar */}
        <NavBar user={user} />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/termekek" element={<Termekek />} />
          <Route path="/termek-felvitel" element={<TermekFelvitel />} />
          <Route path="/termek/:id" element={<TermekReszletek />} />
          <Route path="/kosar" element={<CartPage />} />
          <Route path="/rendeles" element={<Rendeles user={user} />} />
          <Route path="/fizetes" element={<Fizetes user={user} />} />
          <Route path="/rendeles-fix" element={<RendelesFix user={user} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admintermek" element={<Admintermek />} />
          <Route path="/kapcsolat" element={<Kapcsolat />} />
          <Route path="/bejelentes" element={<Bejelentes />} />
          <Route path="/garancia" element={<Garancia />} />
          <Route path="/anyak-torvenyek" element={<AnyakTorvenyek />} />
          <Route path="/barion-payment" element={<BarionPayment />} />
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
      <CartProvider>
        <AppContent />
      </CartProvider>
    </BrowserRouter>
  );
}