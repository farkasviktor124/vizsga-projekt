// src/components/RendelesFix.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext.jsx";
import "./Rendeles.css";

const RendelesFix = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const rendelesAdatok = JSON.parse(localStorage.getItem("rendelesAdatok") || "{}");
  const [megjegyzes, setMegjegyzes] = useState("");
  const [rendelesLeadva, setRendelesLeadva] = useState(false);

  const getSzallitasModSzoveg = () => {
    const modok = {
      hazhoz: "Házhozszállítás",
      gls_automata: "GLS Automata",
      gls_pont: "GLS Pont",
      foxpost: "Foxpost",
      packeta: "Packeta"
    };
    return modok[rendelesAdatok.szallitasMod] || rendelesAdatok.szallitasMod;
  };

  const getFizetesModSzoveg = () => {
    const modok = {
      bankkartya: "Bankkártya",
      atutalas: "Átutalás",
      utanvetel: "Utánvétel"
    };
    return modok[rendelesAdatok.fizetesMod] || rendelesAdatok.fizetesMod;
  };

  const handleMegrendeles = () => {
    const veglegesRendeles = {
      ...rendelesAdatok,
      megjegyzes,
      rendelesDatum: new Date().toLocaleString(),
      rendelesSzam: "REND-" + Date.now()
    };
    
    localStorage.setItem("veglegesRendeles", JSON.stringify(veglegesRendeles));
    clearCart();
    localStorage.removeItem("rendelesAdatok");
    setRendelesLeadva(true);
    
    setTimeout(() => {
      navigate("/");
    }, 3000);
  };

  if (rendelesLeadva) {
    return (
      <div className="rendeles-container">
        <div className="sikeres-uzenet">
          <h2>✅ Rendelés sikeresen leadva!</h2>
          <p>Köszönjük a vásárlást!</p>
          <p>Visszairányítás a főoldalra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rendeles-container">
      <h1>Rendelés összesítése</h1>
      
      <div className="rendeles-grid">
        <div className="rendeles-form">
          {/* Számlázási adatok */}
          <div className="form-section">
            <h2>Számlázási adatok</h2>
            <p><strong>Név:</strong> {rendelesAdatok.szamlazasiAdatok?.nev}</p>
            <p><strong>Email:</strong> {rendelesAdatok.szamlazasiAdatok?.email}</p>
            <p><strong>Telefon:</strong> {rendelesAdatok.szamlazasiAdatok?.telefon}</p>
            <p><strong>Cím:</strong> {rendelesAdatok.szamlazasiAdatok?.iranyitoszam} {rendelesAdatok.szamlazasiAdatok?.varos}, {rendelesAdatok.szamlazasiAdatok?.cim}</p>
          </div>

          {/* Szállítási adatok */}
          <div className="form-section">
            <h2>Szállítási adatok</h2>
            <p><strong>Szállítási mód:</strong> {getSzallitasModSzoveg()}</p>
            {rendelesAdatok.szallitasPont && <p><strong>Átvételi pont:</strong> {rendelesAdatok.szallitasPont}</p>}
            <p><strong>Cím:</strong> {rendelesAdatok.szallitasiAdatok?.iranyitoszam} {rendelesAdatok.szallitasiAdatok?.varos}, {rendelesAdatok.szallitasiAdatok?.cim}</p>
          </div>

          {/* Fizetési adatok */}
          <div className="form-section">
            <h2>Fizetési adatok</h2>
            <p><strong>Fizetési mód:</strong> {getFizetesModSzoveg()}</p>
            {rendelesAdatok.fizetesMod === "utanvetel" && (
              <p><strong>Utánvételi díj:</strong> {rendelesAdatok.utanvetelDij?.toLocaleString()} Ft</p>
            )}
          </div>

          {/* Megjegyzés mező */}
          <div className="form-section">
            <h2>Megjegyzés a rendeléshez</h2>
            <textarea 
              className="megjegyzes-textarea"
              placeholder="Írj ide bármilyen megjegyzést a rendeléseddel kapcsolatban..."
              value={megjegyzes}
              onChange={(e) => setMegjegyzes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="gombok">
            <button className="vissza-gomb" onClick={() => navigate("/fizetes")}>← Vissza</button>
            <button className="megrendeles-gomb" onClick={handleMegrendeles}>Megrendelés véglegesítése</button>
          </div>
        </div>

        {/* Összegzés */}
        <div className="rendeles-osszegzes">
          <h2>Rendelés összegzése</h2>
          
          <div className="termekek-listaja">
            <h3>Termékek:</h3>
            {rendelesAdatok.termekek?.map((item, index) => (
              <div key={index} className="osszegzes-item">
                <span>{item.nev} x{item.quantity}</span>
                <span>{((item.akcios_ar ?? item.ar) * item.quantity).toLocaleString()} Ft</span>
              </div>
            ))}
          </div>
          
          <div className="osszegzes-item">
            <span>Részösszeg:</span>
            <span>{(rendelesAdatok.vegosszeg || 0).toLocaleString()} Ft</span>
          </div>
          
          {rendelesAdatok.fizetesMod === "utanvetel" && (
            <div className="osszegzes-item">
              <span>Utánvételi díj (+25%):</span>
              <span>{rendelesAdatok.utanvetelDij?.toLocaleString()} Ft</span>
            </div>
          )}
          
          <div className="osszegzes-item total">
            <span>Végösszeg:</span>
            <span>{rendelesAdatok.fizetendoOsszeg?.toLocaleString()} Ft</span>
          </div>
          
          {megjegyzes && (
            <div className="megjegyzes-preview">
              <strong>Megjegyzés:</strong>
              <p>{megjegyzes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RendelesFix;