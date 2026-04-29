import { useEffect, useState, useCallback } from "react";
import ProductCard from "./ProductCard";
import { useCart } from "./CartContext.jsx";
import "./TermekekStyle.css";

function Termekek() {
  const { cartItems } = useCart();
  const [termekek, setTermekek] = useState([]);
  const [szurtTermekek, setSzurtTermekek] = useState([]);
  const [regiOnly, setRegiOnly] = useState(false);
  const [ujOnly, setUjOnly] = useState(false);
  const [evMin, setEvMin] = useState(1980);
  const [evMax, setEvMax] = useState(2030);
  const [arMin, setArMin] = useState(0);
  const [arMax, setArMax] = useState(1000000); 
  const [sortOption, setSortOption] = useState("");
  const [szuroNyitva, setSzuroNyitva] = useState(false);
  const [loading, setLoading] = useState(true);

  // Adatok betöltése a backendről
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:4000/termekek");
      if (!response.ok) throw new Error('Hálózati hiba');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setTermekek(data);
        setSzurtTermekek(data);
        const maxAr = Math.max(...data.map(t => t.ar || 0), 600000);
        setArMax(maxAr);
      }
    } catch (err) {
      console.error("Hiba:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Szűrés és rendezés
  const filterAndSortProducts = useCallback((products) => {
    if (!products || products.length === 0) return [];

    let filtered = [...products];

    // Állapot szűrés
    if (regiOnly && !ujOnly) {
      filtered = filtered.filter(t => t.allapot === "Használt");
    } else if (!regiOnly && ujOnly) {
      filtered = filtered.filter(t => t.allapot === "Új");
    }

    // Ár szűrés
    filtered = filtered.filter(t => {
      const ar = t.akcios_ar ?? t.ar ?? 0;
      return ar >= arMin && ar <= arMax;
    });

    // Évjárat szűrés
    filtered = filtered.filter(t => {
      const ev = t.evjarat ?? 0;
      return ev >= evMin && ev <= evMax;
    });

    // Rendezés
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

    return filtered;
  }, [regiOnly, ujOnly, arMin, arMax, evMin, evMax, sortOption]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (cartItems !== undefined) {
      loadProducts();
    }
  }, [cartItems, loadProducts]);

  useEffect(() => {
    if (termekek.length > 0) {
      const filtered = filterAndSortProducts(termekek);
      setSzurtTermekek(filtered);
    }
  }, [filterAndSortProducts, termekek]);

  const handleReject = (id) => {
    setSzurtTermekek(prev => prev.filter(t => t.id !== id));
  };

  // Évjárat maximum kezelés
  const handleEvMaxChange = (e) => {
    setEvMax(Number(e.target.value));
  };

  // Ár maximum kezelés
  const handleArMaxChange = (e) => {
    setArMax(Number(e.target.value));
  };

  if (loading) {
    return <div style={{ padding: "50px", textAlign: "center" }}>Betöltés...</div>;
  }

  return (
    <div className="termekek-container">
      <button 
        className="mobil-szuro-gomb"
        onClick={() => setSzuroNyitva(!szuroNyitva)}
      >
        🔍 Szűrők {szuroNyitva ? "▲" : "▼"}
      </button>

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
                onChange={handleEvMaxChange}
                className="slider"
              />
              <div className="ertekek">
                <span>{evMin}</span>
                <span>-</span>
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
                max={1000000}
                value={arMax}
                onChange={handleArMaxChange}
                className="slider"
              />
              <div className="ertekek">
                <span>{arMin.toLocaleString()} Ft</span>
                <span>-</span>
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