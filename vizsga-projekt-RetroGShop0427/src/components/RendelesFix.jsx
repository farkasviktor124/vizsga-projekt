// src/components/RendelesFix.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext.jsx";
import "./Rendeles.css";

const RendelesFix = () => {
  const navigate = useNavigate();
  const { submitOrder, cartItems } = useCart();
  const rendelesAdatok = JSON.parse(localStorage.getItem("rendelesAdatok") || "{}");
  const [megjegyzes, setMegjegyzes] = useState("");
  const [rendelesLeadva, setRendelesLeadva] = useState(false);
  const [rendelesFolyamatban, setRendelesFolyamatban] = useState(false);

  const getSzallitasModSzoveg = () => {
    const modok = {
      hazhoz: "Házhozszállítás",
      gls_automata: "GLS Automata",
      gls_pont: "GLS Pont",
      foxpost: "Foxpost",
      packeta: "Packeta",
      mpl: "MPL (Magyar Posta)",
      dpd: "DPD",
      expressone: "Express One"
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

  // Átvételi pont nevének lekérése (ha objektum, akkor a nev tulajdonságot használjuk)
  const getAtveteliPontNev = () => {
    const pont = rendelesAdatok.szallitasPont;
    if (!pont) return null;
    if (typeof pont === 'object') {
      return pont.nev || pont.cim || "Átvételi pont";
    }
    return pont;
  };

  const handleMegrendeles = async () => {
    if (rendelesFolyamatban) return;
    
    setRendelesFolyamatban(true);
    
    const veglegesRendeles = {
      ...rendelesAdatok,
      megjegyzes,
      rendelesDatum: new Date().toLocaleString(),
      rendelesSzam: "REND-" + Date.now(),
      cartItems: cartItems
    };
    
    const result = await submitOrder(veglegesRendeles);
    
    if (result.success) {
      localStorage.setItem("veglegesRendeles", JSON.stringify(veglegesRendeles));
      localStorage.removeItem("rendelesAdatok");
      setRendelesLeadva(true);
      
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } else {
      setRendelesFolyamatban(false);
    }
  };

  if (rendelesLeadva) {
    return (
      <div className="rendeles-container">
        <div className="sikeres-uzenet">
          <h2>✅ Rendelés sikeresen leadva!</h2>
          <p>Köszönjük a vásárlást!</p>
          <p>A készlet frissítésre került.</p>
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
          <div className="form-section">
            <h2>Számlázási adatok</h2>
            <p><strong>Név:</strong> {rendelesAdatok.szamlazasiAdatok?.nev}</p>
            <p><strong>Email:</strong> {rendelesAdatok.szamlazasiAdatok?.email}</p>
            <p><strong>Telefon:</strong> {rendelesAdatok.szamlazasiAdatok?.telefon}</p>
            <p><strong>Cím:</strong> {rendelesAdatok.szamlazasiAdatok?.iranyitoszam} {rendelesAdatok.szamlazasiAdatok?.varos}, {rendelesAdatok.szamlazasiAdatok?.cim}</p>
          </div>

          <div className="form-section">
            <h2>Szállítási adatok</h2>
            <p><strong>Szállítási mód:</strong> {getSzallitasModSzoveg()}</p>
            {getAtveteliPontNev() && <p><strong>Átvételi pont:</strong> {getAtveteliPontNev()}</p>}
            <p><strong>Cím:</strong> {rendelesAdatok.szallitasiAdatok?.iranyitoszam} {rendelesAdatok.szallitasiAdatok?.varos}, {rendelesAdatok.szallitasiAdatok?.cim}</p>
          </div>

          <div className="form-section">
            <h2>Fizetési adatok</h2>
            <p><strong>Fizetési mód:</strong> {getFizetesModSzoveg()}</p>
            {rendelesAdatok.fizetesMod === "utanvetel" && (
              <p><strong>Utánvételi díj:</strong> {rendelesAdatok.utanvetelDij?.toLocaleString()} Ft</p>
            )}
          </div>

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
            <button 
              className="megrendeles-gomb" 
              onClick={handleMegrendeles}
              disabled={rendelesFolyamatban}
            >
              {rendelesFolyamatban ? "Feldolgozás..." : "Megrendelés véglegesítése"}
            </button>
          </div>
        </div>

        <div className="rendeles-osszegzes">
          <h2>Rendelés összegzése</h2>
          
          <div className="termekek-listaja">
            <h3>Termékek:</h3>
            {rendelesAdatok.termekek?.map((item, index) => {
              const mennyiseg = item.quantity || item.mennyiseg || 1;
              const ar = item.akcios_ar ?? item.ar ?? 0;
              return (
                <div key={index} className="osszegzes-item">
                  <span>{item.nev} x{mennyiseg}</span>
                  <span>{(ar * mennyiseg).toLocaleString()} Ft</span>
                </div>
              );
            })}
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
            <span>{(rendelesAdatok.fizetendoOsszeg || rendelesAdatok.vegosszeg || 0).toLocaleString()} Ft</span>
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