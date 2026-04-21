import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import "./TermekekStyle.css";

function Termekek() {
  const [termekek, setTermekek] = useState([]);
  const [szurtTermekek, setSzurtTermekek] = useState([]);
  const [regiOnly, setRegiOnly] = useState(false);
  const [ujOnly, setUjOnly] = useState(false);
  const [evMin, setEvMin] = useState(1980);
  const [evMax, setEvMax] = useState(2030);
  const [arMin, setArMin] = useState(0);
  const [arMax, setArMax] = useState(600000);
  const [sortOption, setSortOption] = useState("");
  const [szuroNyitva, setSzuroNyitva] = useState(false);

  useEffect(() => {
    fetch("http://localhost:4000/termekek")
      .then(res => {
        if (!res.ok) throw new Error('Hálózati hiba');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setTermekek(data);
          setSzurtTermekek(data);
        } else {
          setTermekek([]);
          setSzurtTermekek([]);
        }
      })
      .catch(err => console.error("Hiba a termékek lekérésekor:", err));
  }, []);

  useEffect(() => {
    if (!Array.isArray(termekek)) {
      setSzurtTermekek([]);
      return;
    }

    let filtered = [...termekek];

    if (regiOnly && !ujOnly) {
      filtered = filtered.filter(t => t.allapot === "Használt");
    } else if (!regiOnly && ujOnly) {
      filtered = filtered.filter(t => t.allapot === "Új");
    }

    filtered = filtered.filter(t => {
      const ar = t.akcios_ar ?? t.ar ?? 0;
      return ar >= arMin && ar <= arMax;
    });

    filtered = filtered.filter(t => {
      const ev = t.evjarat ?? 0;
      return ev >= evMin && ev <= evMax;
    });

    if (sortOption === "ev_asc") {
      filtered.sort((a, b) => (a.evjarat ?? 0) - (b.evjarat ?? 0));
    } else if (sortOption === "ev_desc") {
      filtered.sort((a, b) => (b.evjarat ?? 0) - (a.evjarat ?? 0));
    } else if (sortOption === "ar_asc") {
      filtered.sort((a, b) => (a.akcios_ar ?? a.ar ?? 0) - (b.akcios_ar ?? b.ar ?? 0));
    } else if (sortOption === "ar_desc") {
      filtered.sort((a, b) => (b.akcios_ar ?? b.ar ?? 0) - (a.akcios_ar ?? a.ar ?? 0));
    } else if (sortOption === "abc") {
      filtered.sort((a, b) => a.nev.localeCompare(b.nev));
    }

    setSzurtTermekek(filtered);
  }, [regiOnly, ujOnly, arMin, arMax, evMin, evMax, termekek, sortOption]);

  const handleReject = (id) => {
    setSzurtTermekek(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="termekek-container">
      {/* Mobil szűrő gomb */}
      <button 
        className="mobil-szuro-gomb"
        onClick={() => setSzuroNyitva(!szuroNyitva)}
      >
        🔍 Szűrők {szuroNyitva ? "▲" : "▼"}
      </button>

      {/* Szűrő oldalsáv */}
      <aside className={`szuro-oldalsav ${szuroNyitva ? 'nyitva' : ''}`}>
        <div className="szuro-header">
          <h2>Szűrés</h2>
          <button 
            className="szuro-bezaras"
            onClick={() => setSzuroNyitva(false)}
          >
            ✕
          </button>
        </div>

        <div className="szuro-opciok">
          <div className="allapot-szuro">
            <h3>Állapot</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={regiOnly}
                onChange={(e) => setRegiOnly(e.target.checked)}
              />
              <span>Használt</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={ujOnly}
                onChange={(e) => setUjOnly(e.target.checked)}
              />
              <span>Új</span>
            </label>
          </div>

          <div className="evjarat-szuro">
            <h3>Évjárat</h3>
            <div className="slider-container">
              <input
                type="range"
                min="1980"
                max="2030"
                value={evMax}
                onChange={(e) => setEvMax(Number(e.target.value))}
                className="slider"
              />
              <div className="ertekek">
                <span>{evMin}</span>
                <span>{evMax}</span>
              </div>
            </div>
          </div>

          <div className="ar-szuro">
            <h3>Ár (Ft)</h3>
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max="600000"
                value={arMax}
                onChange={(e) => setArMax(Number(e.target.value))}
                className="slider"
              />
              <div className="ertekek">
                <span>{arMin.toLocaleString()} Ft</span>
                <span>{arMax.toLocaleString()} Ft</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rendezes">
          <h3>Rendezés:</h3>
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="rendezes-select">
            <option value="">Feltöltés szerint</option>
            <option value="ev_asc">Év szerint növekvő</option>
            <option value="ev_desc">Év szerint csökkenő</option>
            <option value="ar_asc">Ár szerint növekvő</option>
            <option value="ar_desc">Ár szerint csökkenő</option>
            <option value="abc">Név szerint</option>
          </select>
        </div>

        <div className="talalatok-szama">
           Találatok: {szurtTermekek.length}
        </div>
      </aside>

      <div className="termekek-grid">
        {szurtTermekek.map((t) => (
          <ProductCard
            key={t.id}
            product={t}
            onReject={handleReject}
          />
        ))}
      </div>
    </div>
  );
}

export default Termekek;