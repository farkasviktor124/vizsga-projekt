import React, { useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";

import Termek from "./components/Termek.jsx";
import Admin from "./components/Admin.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import AuthModal from "./components/AuthModal.jsx";
import Home from "./components/Home.jsx";
import TerrmekFelvitel from "./components/TerrmekFelvitel.jsx";
import NavBar from "./components/NavBar.jsx";
import "./index.css";

function AppContent() {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggedUser, setLoggedUser] = useState("");
  const navigate = useNavigate();

  function handleLoginSuccess(role, username) {
    setLoggedUser(username);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (role === "admin") navigate("/admin");
      else navigate("/");
    }, 2500);
  }

  return (
    <>
      {loading && <LoadingScreen username={loggedUser} />}

      <div className="app">
        <NavBar />

        <header className="header">
          <div className="header-left">
            <h1>RetroGshop</h1>
            <p className="subtitle">
              A retro és modern technológia találkozása!
            </p>
            <button
              className="auth-btn"
              onClick={() => setModalVisible(true)}
            >
              Bejelentkezés / Regisztráció
            </button>
          </div>

          <div className="header-right">
            <button className="cart-btn">Kosár (0)</button>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/termekek" element={<Termek />} />
      <Route path="/termekfelvitel" element={<TerrmekFelvitel />} />
           <Route path="/admin" element={<Admin />} />
      
          
        
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