// src/components/TermekFelvitel.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './TermekFelvitel.css'; 

function TermekFelvitel() {
  const [nev, setNev] = useState("");
  const [ar, setAr] = useState("");
  const [allapot, setAllapot] = useState("Új");
  const [evjarat, setEvjarat] = useState("");
  const [gyarto, setGyarto] = useState("");
  const [arus, setArus] = useState("");
  const [kep, setKep] = useState(null);
  const [kepPreview, setKepPreview] = useState(null);
  const [termektipus, setTermektipus] = useState("");
  const [leiras, setLeiras] = useState("");
  const [keszlet, setKeszlet] = useState(0);  // 🆕 Készlet state hozzáadva
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Bejelentkezett felhasználó adatainak lekérése
  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user;
    } catch { 
      return null; 
    }
  };

  // Komponens betöltésekor beállítjuk az árus nevet
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username) {
      setArus(currentUser.username);
    }
  }, []);

  const handleKepValasztas = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setKep(file);
      setKepPreview(URL.createObjectURL(file));
    }
    e.target.value = "";
  };

  const handleKepTorles = () => {
    setKep(null);
    setKepPreview(null);
  };

  const kuldes = async (e) => {
    e.preventDefault();
    
    if (!nev || !ar) {
      setMessage("❌ Név és ár megadása kötelező!");
      return;
    }

    if (!arus) {
      setMessage("❌ Nincs bejelentkezett felhasználó!");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("nev", nev);
    formData.append("ar", ar);
    formData.append("allapot", allapot);
    formData.append("evjarat", evjarat);
    formData.append("gyarto", gyarto);
    formData.append("arus", arus);
    formData.append("termekTipus", termektipus);
    formData.append("leiras", leiras);
    formData.append("keszlet", keszlet);  // 🆕 Készlet hozzáadva
    if (kep) formData.append("kep", kep);

    try {
      const response = await fetch("http://localhost:4000/termekek", {
        method: "POST",
        body: formData,
      });

      let data;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        console.error("Nem JSON válasz érkezett:", textResponse);
        throw new Error(`A szerver válasza: ${textResponse.substring(0, 100)}...`);
      }

      if (response.ok) {
        setMessage("✅ " + (data.message || "Termék sikeresen hozzáadva!"));
        // Űrlap alaphelyzetbe állítása
        setNev("");
        setAr("");
        setAllapot("Új");
        setEvjarat("");
        setGyarto("");
        setTermektipus("");
        setLeiras("");
        setKeszlet(0);  // 🆕 Készlet reset
        setKep(null);
        setKepPreview(null);
        
        setTimeout(() => navigate("/termekek"), 2000);
      } else {
        setMessage("❌ " + (data.message || data.error || "Ismeretlen hiba történt"));
      }
    } catch (error) {
      console.error("HIBA:", error);
      if (error.message.includes("Failed to fetch")) {
        setMessage("❌ Nem sikerült csatlakozni a szerverhez!");
      } else {
        setMessage("❌ Hiba történt: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="termekfelvitel-container">
      <h2>Termék felvítel</h2>
      
      <form onSubmit={kuldes}>
        <input 
          placeholder="Termék név *" 
          value={nev} 
          onChange={e => setNev(e.target.value)} 
          required
        />
        
        <input 
          placeholder="Ár *" 
          type="number"
          value={ar} 
          onChange={e => setAr(e.target.value)} 
          required
        />

        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="allapot"
              value="Használt"
              checked={allapot === "Használt"}
              onChange={(e) => setAllapot(e.target.value)}
            />
            Használt
          </label>
          <label>
            <input
              type="radio"
              name="allapot"
              value="Új"
              checked={allapot === "Új"}
              onChange={(e) => setAllapot(e.target.value)}
            />
            Új
          </label>
        </div>

        <input 
          placeholder="Évjárat" 
          value={evjarat} 
          onChange={e => setEvjarat(e.target.value)} 
        />
        
        <input 
          placeholder="Gyártó" 
          value={gyarto} 
          onChange={e => setGyarto(e.target.value)} 
        />

        {/* 🆕 Készlet mező */}
        <input 
          placeholder="Készlet (db)" 
          type="number"
          min="0"
          value={keszlet} 
          onChange={e => setKeszlet(parseInt(e.target.value) || 0)} 
        />
        
        {/* Árus mező - csak label */}
        <div className="arus-field">
          <label>Árus</label>
          <div className="arus-value">{arus || "Nincs bejelentkezve"}</div>
        </div>
        
        <input
          placeholder="Termék típusa"
          value={termektipus}
          onChange={(e) => setTermektipus(e.target.value)}
        />
        
        <textarea
          placeholder="Leírás"
          value={leiras}
          onChange={(e) => setLeiras(e.target.value)}
          rows={4}
        />
        
        {/* Kép feltöltés szekció */}
        {!kepPreview ? (
          <div className="file-upload-container">
            <label className="file-upload">
              <span>📷 + Kép feltöltése</span>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleKepValasztas}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        ) : (
          <div className="image-preview-container">
            <img
              src={kepPreview}
              alt="Előnézet"
              className="image-preview"
            />
            <p className="file-name">📎 {kep?.name}</p>
            <div className="image-buttons">
              <label className="modify-button">
                ✏️ Módosítás
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleKepValasztas}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                type="button"
                onClick={handleKepTorles}
                className="delete-button"
              >
                ✕ Törlés
              </button>
            </div>
          </div>
        )}
        
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? "⏳ Feldolgozás..." : "💾 Termék mentése"}
        </button>

        {message && (
          <div className={`message ${message.includes("✅") ? "success" : "error"}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default TermekFelvitel;