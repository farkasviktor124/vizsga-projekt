// src/components/Rendeles.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext.jsx";
import "./Rendeles.css";

const Rendeles = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  
  const [szallitasMod, setSzallitasMod] = useState("hazhoz");
  const [szallitasPont, setSzallitasPont] = useState("");
  const [szamlazasiAdatok, setSzamlazasiAdatok] = useState({
    nev: "",
    email: "",
    telefon: "",
    iranyitoszam: "",
    varos: "",
    cim: ""
  });
  const [szallitasiAdatok, setSzallitasiAdatok] = useState({
    iranyitoszam: "",
    varos: "",
    cim: ""
  });
  const [samlaEgyezik, setSamlaEgyezik] = useState(true);
  const [hiba, setHiba] = useState("");

  // Gls automata lista
  const glsAutomataLista = [
    "Budapest - Aréna Pláza",
    "Budapest - WestEnd",
    "Budapest - Árkád",
    "Debrecen - Fórum",
    "Szeged - Árkád",
    "Miskolc - Pláza",
    "Pécs - Árkád",
    "Győr - Pláza"
  ];

  // Foxpost lista
  const foxpostLista = [
    "Budapest - XIII. ker",
    "Budapest - XI. ker",
    "Budapest - VI. ker",
    "Debrecen - Csapókert",
    "Szeged - Rókusi",
    "Miskolc - Avas",
    "Pécs - Belváros"
  ];

  // Packeta lista
  const packetaLista = [
    "Budapest - Allee",
    "Budapest - MOM Park",
    "Budapest - Etele Pláza",
    "Debrecen - Nagyállomás",
    "Szeged - Belváros"
  ];

  const handleSzamlazasiChange = (e) => {
    const { name, value } = e.target;
    setSzamlazasiAdatok(prev => ({ ...prev, [name]: value }));
    if (samlaEgyezik) {
      setSzallitasiAdatok(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSzallitasiChange = (e) => {
    const { name, value } = e.target;
    setSzallitasiAdatok(prev => ({ ...prev, [name]: value }));
  };

  const handleTovabb = () => {
    // Validáció
    if (!szamlazasiAdatok.nev || !szamlazasiAdatok.email || !szamlazasiAdatok.telefon) {
      setHiba("Kérlek töltsd ki a kötelező mezőket!");
      return;
    }
    if (!szallitasMod) {
      setHiba("Kérlek válassz szállítási módot!");
      return;
    }
    if ((szallitasMod === "gls_automata" || szallitasMod === "gls_pont" || szallitasMod === "foxpost" || szallitasMod === "packeta") && !szallitasPont) {
      setHiba("Kérlek válassz átvételi pontot!");
      return;
    }

    const rendelesAdatok = {
      szallitasMod,
      szallitasPont,
      szamlazasiAdatok,
      szallitasiAdatok: samlaEgyezik ? szamlazasiAdatok : szallitasiAdatok,
      termekek: cartItems,
      vegosszeg: cartTotal
    };
    
    localStorage.setItem("rendelesAdatok", JSON.stringify(rendelesAdatok));
    navigate("/fizetes");
  };

  const getSzallitasAr = () => {
    if (cartTotal > 50000) return 0;
    switch(szallitasMod) {
      case "hazhoz": return 1990;
      case "gls_automata": return 1290;
      case "gls_pont": return 1490;
      case "foxpost": return 1190;
      case "packeta": return 1390;
      default: return 1990;
    }
  };

  return (
    <div className="rendeles-container">
      <h1>Rendelés folyamata</h1>
      
      <div className="rendeles-grid">
        <div className="rendeles-form">
          {/* Számlázási adatok */}
          <div className="form-section">
            <h2>SZÁMLÁZÁSI ADATOK</h2>
            <div className="form-row">
              <input type="text" name="nev" placeholder="Név *" value={szamlazasiAdatok.nev} onChange={handleSzamlazasiChange} />
              <input type="email" name="email" placeholder="Email *" value={szamlazasiAdatok.email} onChange={handleSzamlazasiChange} />
            </div>
            <div className="form-row">
              <input type="tel" name="telefon" placeholder="Telefonszám *" value={szamlazasiAdatok.telefon} onChange={handleSzamlazasiChange} />
              <input type="text" name="iranyitoszam" placeholder="Irányítószám" value={szamlazasiAdatok.iranyitoszam} onChange={handleSzamlazasiChange} />
            </div>
            <div className="form-row">
              <input type="text" name="varos" placeholder="Város" value={szamlazasiAdatok.varos} onChange={handleSzamlazasiChange} />
              <input type="text" name="cim" placeholder="Cím" value={szamlazasiAdatok.cim} onChange={handleSzamlazasiChange} />
            </div>
          </div>

          {/* Szállítási adatok */}
          <div className="form-section">
            <label className="checkbox-label">
              <input type="checkbox" checked={samlaEgyezik} onChange={(e) => setSamlaEgyezik(e.target.checked)} />
              Szállítási cím megegyezik a számlázási címmel
            </label>
            
            {!samlaEgyezik && (
              <div className="szallitasi-resz">
                <h2>SzÁLLÍTÁSI ADATOK</h2>
                <div className="form-row">
                  <input type="text" name="iranyitoszam" placeholder="Irányítószám" value={szallitasiAdatok.iranyitoszam} onChange={handleSzallitasiChange} />
                  <input type="text" name="varos" placeholder="Város" value={szallitasiAdatok.varos} onChange={handleSzallitasiChange} />
                </div>
                <input type="text" name="cim" placeholder="Cím" value={szallitasiAdatok.cim} onChange={handleSzallitasiChange} />
              </div>
            )}
          </div>

          {/* Szállítási mód */}
          <div className="form-section">
            <h2>SzÁLLÍTÁSI MÓD</h2>
            <div className="szallitas-options">
              <label className="szallitas-card">
                <input type="radio" name="szallitas" value="hazhoz" checked={szallitasMod === "hazhoz"} onChange={(e) => setSzallitasMod(e.target.value)} />
                <div>
                  <strong> Házhozszállítás</strong>
                  <span>{getSzallitasAr()} Ft</span>
                </div>
              </label>
              
              <label className="szallitas-card">
                <input type="radio" name="szallitas" value="gls_automata" checked={szallitasMod === "gls_automata"} onChange={(e) => setSzallitasMod(e.target.value)} />
                <div>
                  <strong> GLS Automata</strong>
                  <span>{getSzallitasAr()} Ft</span>
                </div>
              </label>
              
              <label className="szallitas-card">
                <input type="radio" name="szallitas" value="gls_pont" checked={szallitasMod === "gls_pont"} onChange={(e) => setSzallitasMod(e.target.value)} />
                <div>
                  <strong> GLS Pont</strong>
                  <span>{getSzallitasAr()} Ft</span>
                </div>
              </label>
              
              <label className="szallitas-card">
                <input type="radio" name="szallitas" value="foxpost" checked={szallitasMod === "foxpost"} onChange={(e) => setSzallitasMod(e.target.value)} />
                <div>
                  <strong> Foxpost</strong>
                  <span>{getSzallitasAr()} Ft</span>
                </div>
              </label>
              
              <label className="szallitas-card">
                <input type="radio" name="szallitas" value="packeta" checked={szallitasMod === "packeta"} onChange={(e) => setSzallitasMod(e.target.value)} />
                <div>
                  <strong> Packeta</strong>
                  <span>{getSzallitasAr()} Ft</span>
                </div>
              </label>
            </div>

            {(szallitasMod === "gls_automata" || szallitasMod === "gls_pont") && (
              <select className="pont-select" value={szallitasPont} onChange={(e) => setSzallitasPont(e.target.value)}>
                <option value="">Válassz GLS pontot...</option>
                {glsAutomataLista.map(pont => <option key={pont} value={pont}>{pont}</option>)}
              </select>
            )}

            {szallitasMod === "foxpost" && (
              <select className="pont-select" value={szallitasPont} onChange={(e) => setSzallitasPont(e.target.value)}>
                <option value="">Válassz Foxpost automatát...</option>
                {foxpostLista.map(pont => <option key={pont} value={pont}>{pont}</option>)}
              </select>
            )}

            {szallitasMod === "packeta" && (
              <select className="pont-select" value={szallitasPont} onChange={(e) => setSzallitasPont(e.target.value)}>
                <option value="">Válassz Packeta pontot...</option>
                {packetaLista.map(pont => <option key={pont} value={pont}>{pont}</option>)}
              </select>
            )}
          </div>

          {hiba && <div className="hiba-uzenet">{hiba}</div>}
          
          <button className="tovabb-gomb" onClick={handleTovabb}>Tovább a fizetéshez →</button>
        </div>

        {/* Kosár összegzés */}
        <div className="rendeles-osszegzes">
          <h2>Rendelés összegzése</h2>
          <div className="osszegzes-item">
            <span>Termékek összesen:</span>
            <span>{cartTotal.toLocaleString()} Ft</span>
          </div>
          <div className="osszegzes-item">
            <span>SZállítási díj:</span>
            <span>{getSzallitasAr() === 0 ? "Ingyenes" : getSzallitasAr().toLocaleString() + " Ft"}</span>
          </div>
          <div className="osszegzes-item total">
            <span>Összesen:</span>
            <span>{(cartTotal + getSzallitasAr()).toLocaleString()} Ft</span>
          </div>
          <button className="vissza-gomb" onClick={() => navigate("/kosar")}>← Vissza a kosárhoz</button>
        </div>
      </div>
    </div>
  );
};

export default Rendeles;