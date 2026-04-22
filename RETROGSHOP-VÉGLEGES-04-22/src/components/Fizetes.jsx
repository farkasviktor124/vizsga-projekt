// src/components/Fizetes.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Rendeles.css";

const Fizetes = () => {
  const navigate = useNavigate();
  const rendelesAdatok = JSON.parse(localStorage.getItem("rendelesAdatok") || "{}");
  const [fizetesMod, setFizetesMod] = useState("");
  const [hiba, setHiba] = useState("");

  const getUtanaVetelDij = () => {
    const osszeg = rendelesAdatok.vegosszeg || 0;
    return osszeg * 0.25; // 25% utánvételi díj
  };

  const getFizetendoOsszeg = () => {
    const alapOsszeg = rendelesAdatok.vegosszeg || 0;
    if (fizetesMod === "utanvetel") {
      return alapOsszeg + getUtanaVetelDij();
    }
    return alapOsszeg;
  };

  const handleFizetes = () => {
    if (!fizetesMod) {
      setHiba("Kérlek válassz fizetési módot!");
      return;
    }
    
    const frissitettAdatok = {
      ...rendelesAdatok,
      fizetesMod,
      utanvetelDij: fizetesMod === "utanvetel" ? getUtanaVetelDij() : 0,
      fizetendoOsszeg: getFizetendoOsszeg()
    };
    
    localStorage.setItem("rendelesAdatok", JSON.stringify(frissitettAdatok));
    navigate("/rendeles-fix");
  };

  return (
    <div className="rendeles-container">
      <h1>Fizetési mód</h1>
      
      <div className="rendeles-grid">
        <div className="rendeles-form">
          <div className="form-section">
            <h2>Válassz fizetési módot</h2>
            
            <div className="fizetes-options">
              <label className="fizetes-card">
                <input type="radio" name="fizetes" value="bankkartya" checked={fizetesMod === "bankkartya"} onChange={(e) => setFizetesMod(e.target.value)} />
                <div>
                  <strong>💳 Bankkártya</strong>
                  <span>Online bankkártyás fizetés</span>
                </div>
              </label>
              
              <label className="fizetes-card">
                <input type="radio" name="fizetes" value="atutalas" checked={fizetesMod === "atutalas"} onChange={(e) => setFizetesMod(e.target.value)} />
                <div>
                  <strong>🏦 Átutalás</strong>
                  <span>Előre utalás banki átutalással</span>
                </div>
              </label>
              
              <label className="fizetes-card">
                <input type="radio" name="fizetes" value="utanvetel" checked={fizetesMod === "utanvetel"} onChange={(e) => setFizetesMod(e.target.value)} />
                <div>
                  <strong>📦 Utánvétel</strong>
                  <span>Fizetés átvételkor (+25% díj)</span>
                </div>
              </label>
            </div>

            {fizetesMod === "utanvetel" && (
              <div className="utanvetel-info">
                <p>⚠️ Utánvételes fizetés esetén +25% díj kerül felszámításra!</p>
                <p>Díj: {getUtanaVetelDij().toLocaleString()} Ft</p>
              </div>
            )}

            {hiba && <div className="hiba-uzenet">{hiba}</div>}
            
            <div className="gombok">
              <button className="vissza-gomb" onClick={() => navigate("/rendeles")}>← Vissza</button>
              <button className="tovabb-gomb" onClick={handleFizetes}>Tovább az összesítésre →</button>
            </div>
          </div>
        </div>

        <div className="rendeles-osszegzes">
          <h2>Fizetendő összeg</h2>
          <div className="osszegzes-item">
            <span>Részösszeg:</span>
            <span>{(rendelesAdatok.vegosszeg || 0).toLocaleString()} Ft</span>
          </div>
          {fizetesMod === "utanvetel" && (
            <div className="osszegzes-item">
              <span>Utánvételi díj (+25%):</span>
              <span>{getUtanaVetelDij().toLocaleString()} Ft</span>
            </div>
          )}
          <div className="osszegzes-item total">
            <span>Végösszeg:</span>
            <span>{getFizetendoOsszeg().toLocaleString()} Ft</span>
          </div>
 
        </div>
      </div>
    </div>
  );
};

export default Fizetes;