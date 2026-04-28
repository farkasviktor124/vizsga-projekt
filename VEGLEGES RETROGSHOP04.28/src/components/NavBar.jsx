// src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const [rolunkOpen, setRolunkOpen] = useState(false);
  const [kereses, setKereses] = useState("");
  const [termekek, setTermekek] = useState([]);
  const [talalatok, setTalalatok] = useState([]);
  const [nyitva, setNyitva] = useState(false);
  const searchRef = useRef(null);
  const isAdmin = user?.role === "admin";

  // Termékek betöltése
  useEffect(() => {
    fetch("http://localhost:4000/termekek")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTermekek(data); })
      .catch(() => {});
  }, []);

  // Keresés szűrés
  useEffect(() => {
    if (kereses.trim() === "") {
      setTalalatok([]);
      setNyitva(false);
      return;
    }
    const szuro = termekek.filter(t =>
      t.nev?.toLowerCase().includes(kereses.toLowerCase())
    );
    setTalalatok(szuro);
    setNyitva(true);
  }, [kereses, termekek]);

  // Kattintás a keresőn kívülre
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setNyitva(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (termek) => {
    setKereses("");
    setNyitva(false);
    navigate(`/termek/${termek.id}`, { state: { product: termek } });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* BAL OLDAL - Menüpontok */}
        <div className="nav-menu">
          <Link to="/" className="nav-link"> Home</Link>
          <Link to="/termekek" className="nav-link"> Termékek</Link>
          
          {user && (
            <Link to="/termek-felvitel" className="nav-link"> Termék felvitel</Link>
          )}

          {/* Rólunk lenyíló menü */}
          <div 
            className="nav-dropdown"
            onMouseEnter={() => setRolunkOpen(true)}
            onMouseLeave={() => setRolunkOpen(false)}
          >
            <button className="nav-link dropdown-btn">ℹ Rólunk ▼</button>
            {rolunkOpen && (
              <div className="dropdown-content">
                <Link to="/kapcsolat" className="dropdown-link"> Kapcsolat</Link>
                <Link to="/bejelentes" className="dropdown-link">Bejelentés</Link>
                <Link to="/garancia" className="dropdown-link"> Garancia beváltás</Link>
                <Link to="/anyak-torvenyek" className="dropdown-link"> ÁSZF</Link>
              </div>
            )}
          </div>

          {isAdmin && (
            <>
              <Link to="/admin" className="nav-link admin-link">🛡️ Admin</Link>
              <Link to="/admintermek" className="nav-link admin-link">📋 Admin Termékek</Link>
            </>
          )}
        </div>

        {/* JOBB OLDAL - Keresősáv */}
        <div className="search-container" ref={searchRef}>
          <div className="search-wrapper">
           
            <input
              type="text"
              placeholder="Keresés termékre..."
              value={kereses}
              onChange={(e) => setKereses(e.target.value)}
              onFocus={() => talalatok.length > 0 && setNyitva(true)}
              className="search-input"
            />
            {kereses && (
              <button className="search-clear" onClick={() => setKereses("")}>
                ✕
              </button>
            )}
          </div>
          
          {nyitva && talalatok.length > 0 && (
            <div className="search-results">
              {talalatok.map(t => (
                <div key={t.id} className="search-result-item" onClick={() => handleSelect(t)}>
                  <img 
                    src={t.kep ? (t.kep.startsWith("http") ? t.kep : `http://localhost:4000${t.kep}`) : ""} 
                    alt={t.nev}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <div className="search-result-info">
                    <div className="search-result-name">{t.nev}</div>
                    <div className="search-result-price">{(t.ar || 0).toLocaleString()} Ft</div>
                  </div>
                  <span className={`search-result-badge ${t.allapot === "Új" ? "new" : "used"}`}>
                    {t.allapot === "Új" ? "✨ Új" : "🔄 Használt"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;