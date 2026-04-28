// src/components/Fizetes.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BarionPayment from "./BarionPayment";
import "./Rendeles.css";

const API_BASE_URL = 'http://localhost:4000';

const Fizetes = () => {
  const navigate = useNavigate();
  const rendelesAdatok = JSON.parse(localStorage.getItem("rendelesAdatok") || "{}");
  const [fizetesMod, setFizetesMod] = useState("");
  const [betoltes, setBetoltes] = useState(false);
  const [hiba, setHiba] = useState("");
  const [showBarionPayment, setShowBarionPayment] = useState(false);

  const getUtanaVetelDij = () => {
    const osszeg = rendelesAdatok.vegosszeg || 0;
    return osszeg * 0.25;
  };

  const getFizetendoOsszeg = () => {
    const alapOsszeg = rendelesAdatok.vegosszeg || 0;
    if (fizetesMod === "utanvetel") {
      return alapOsszeg + getUtanaVetelDij();
    }
    return alapOsszeg;
  };

  // Barion fizetés indítása - saját komponens megnyitása
  const startBarionPayment = () => {
    setShowBarionPayment(true);
  };

  // Utánvétel fizetés
  const handleUtanaVetel = async () => {
    setBetoltes(true);
    setHiba("");
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/fizetes/utanvetel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rendelesId: rendelesAdatok.rendelesId,
          rendelesSzam: rendelesAdatok.rendelesSzam,
          osszeg: getFizetendoOsszeg(),
          fizetesMod: "utanvetel"
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const frissitettAdatok = {
          ...rendelesAdatok,
          fizetesMod,
          utanvetelDij: getUtanaVetelDij(),
          fizetendoOsszeg: getFizetendoOsszeg(),
          fizetesStatusz: "fuggo"
        };
        localStorage.setItem("rendelesAdatok", JSON.stringify(frissitettAdatok));
        navigate("/rendeles-fix");
      } else {
        setHiba(data.error || "Hiba történt a fizetés rögzítésekor!");
      }
    } catch (error) {
      console.error("Utánvétel hiba:", error);
      setHiba("Nem sikerült rögzíteni a fizetést!");
    } finally {
      setBetoltes(false);
    }
  };

  // Átutalás fizetés
  const handleAtutalas = () => {
    const frissitettAdatok = {
      ...rendelesAdatok,
      fizetesMod,
      fizetendoOsszeg: getFizetendoOsszeg(),
      fizetesStatusz: "fuggo",
      bankiInfo: {
        szamlaSzam: "11773003-12345678-00000000",
        kedvezmenyes: "RETROGSHOP Kft.",
        kozlemeny: `Rendelés szám: ${rendelesAdatok.rendelesSzam}`
      }
    };
    localStorage.setItem("rendelesAdatok", JSON.stringify(frissitettAdatok));
    navigate("/rendeles-fix");
  };

  const handleFizetes = () => {
    if (!fizetesMod) {
      setHiba("Kérlek válassz fizetési módot!");
      return;
    }
    
    if (fizetesMod === "bankkartya") {
      startBarionPayment();
    } else if (fizetesMod === "atutalas") {
      handleAtutalas();
    } else if (fizetesMod === "utanvetel") {
      handleUtanaVetel();
    }
  };

  // Barion fizetés sikeres kezelése
  const handleBarionSuccess = (paymentResult) => {
    console.log("Fizetés sikeres:", paymentResult);
    const frissitettAdatok = {
      ...rendelesAdatok,
      fizetesMod: "bankkartya",
      fizetendoOsszeg: getFizetendoOsszeg(),
      fizetesStatusz: "fizetve",
      barionPaymentId: paymentResult.paymentId
    };
    localStorage.setItem("rendelesAdatok", JSON.stringify(frissitettAdatok));
    
    // Opcionális: backend értesítése a sikeres fizetésről
    fetch(`${API_BASE_URL}/api/barion/payment-success`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rendelesId: rendelesAdatok.rendelesId,
        rendelesSzam: rendelesAdatok.rendelesSzam,
        paymentId: paymentResult.paymentId,
        osszeg: getFizetendoOsszeg()
      })
    }).catch(err => console.error("Backend értesítési hiba:", err));
    
    navigate("/rendeles-fix");
  };

  // Barion fizetés megszakítása
  const handleBarionCancel = () => {
    setShowBarionPayment(false);
    setHiba("A fizetés megszakításra került.");
  };

  // Ha a BarionPayment komponens látszik, azt jelenítjük meg
  if (showBarionPayment) {
    return (
      <BarionPayment 
        orderDetails={{
          osszeg: getFizetendoOsszeg(),
          rendelesSzam: rendelesAdatok.rendelesSzam,
          rendelesId: rendelesAdatok.rendelesId,
          nev: rendelesAdatok.szamlazasiAdatok?.nev,
          email: rendelesAdatok.szamlazasiAdatok?.email
        }}
        onSuccess={handleBarionSuccess}
        onCancel={handleBarionCancel}
      />
    );
  }

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
                  <span>Online bankkártyás fizetés Barion rendszeren keresztül</span>
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

            {fizetesMod === "atutalas" && (
              <div className="atutalas-info">
                <p>🏦 Kérjük, utald át a végösszeget az alábbi bankszámlára:</p>
                <div className="bank-adatok">
                  <p><strong>Számlaszám:</strong> 11773003-12345678-00000000</p>
                  <p><strong>Kedvezményezett:</strong> RETROGSHOP Kft.</p>
                  <p><strong>Közlemény:</strong> Rendelés száma: {rendelesAdatok.rendelesSzam}</p>
                </div>
                <p>📧 Az utalás beérkezése után e-mailben értesítünk a rendelés állapotáról.</p>
              </div>
            )}

            {hiba && <div className="hiba-uzenet">{hiba}</div>}
            
            <div className="gombok">
              <button className="vissza-gomb" onClick={() => navigate("/rendeles")} disabled={betoltes}>← Vissza</button>
              <button className="tovabb-gomb" onClick={handleFizetes} disabled={betoltes}>
                {betoltes ? "Feldolgozás..." : "Fizetés →"}
              </button>
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