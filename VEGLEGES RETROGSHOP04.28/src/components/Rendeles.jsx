// src/components/Rendeles.jsx - JAVÍTOTT (lista nézet nem kér térképes adatokat)

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext.jsx";
import "./Rendeles.css";

// Backend URL
const API_BASE_URL = 'http://localhost:4000';

const Rendeles = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  
  const [szallitasMod, setSzallitasMod] = useState("hazhoz");
  const [szallitasPont, setSzallitasPont] = useState("");
  const [kivalasztottPont, setKivalasztottPont] = useState(null);
  const [szamlazasiAdatok, setSzamlazasiAdatok] = useState({
    nev: "", email: "", telefon: "", iranyitoszam: "", varos: "", cim: "", adoszam: "", cegnev: ""
  });
  const [szallitasiAdatok, setSzallitasiAdatok] = useState({
    iranyitoszam: "", varos: "", cim: ""
  });
  const [samlaEgyezik, setSamlaEgyezik] = useState(true);
  const [hiba, setHiba] = useState("");
  const [betoltes, setBetoltes] = useState(false);
  const [atveteliPontok, setAtveteliPontok] = useState([]);
  const [szurtPontok, setSzurtPontok] = useState([]);
  const [kereses, setKereses] = useState("");
  const [valasztottVaros, setValasztottVaros] = useState("");
  const [varosok, setVarosok] = useState([]);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [googleMapsKey, setGoogleMapsKey] = useState("");
  const [terkepMod, setTerkepMod] = useState(true);
  const [mapError, setMapError] = useState(false);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const [szallitasiModok, setSzallitasiModok] = useState([
    { id: "hazhoz", nev: "Házhozszállítás", ar: 1990, icon: "🏠" },
    { id: "gls_automata", nev: "GLS Automata", ar: 1290, icon: "📦" },
    { id: "gls_pont", nev: "GLS Pont", ar: 1490, icon: "🏪" },
    { id: "foxpost", nev: "Foxpost", ar: 1190, icon: "🦊" },
    { id: "packeta", nev: "Packeta", ar: 1390, icon: "📮" },
    { id: "mpl", nev: "MPL (Magyar Posta)", ar: 1490, icon: "📬" },
    { id: "dpd", nev: "DPD", ar: 1590, icon: "🚚" },
    { id: "expressone", nev: "Express One", ar: 1690, icon: "⚡" }
  ]);

  // Google Maps API kulcs lekérése a backendről
  useEffect(() => {
    const fetchGoogleMapsKey = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/google-maps-key`);
        if (response.ok) {
          const data = await response.json();
          setGoogleMapsKey(data.key);
        } else {
          console.error('Nem sikerült lekérni a Google Maps API kulcsot');
          setMapError(true);
          setTerkepMod(false);
        }
      } catch (error) {
        console.error('Hiba a Google Maps API kulcs lekérésekor:', error);
        setMapError(true);
        setTerkepMod(false);
      }
    };
    fetchGoogleMapsKey();
  }, []);

  // Google Maps betöltése a kulcs birtokában
  useEffect(() => {
    if (!googleMapsKey) return;
    
    const loadGoogleMaps = () => {
      if (document.getElementById('google-maps-script')) {
        if (window.google) {
          setGoogleMapsLoaded(true);
          initMap();
        }
        return;
      }
      
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setGoogleMapsLoaded(true);
        initMap();
      };
      script.onerror = () => {
        console.error('Google Maps betöltése sikertelen');
        setMapError(true);
        setTerkepMod(false);
      };
      document.head.appendChild(script);
    };
    
    loadGoogleMaps();
  }, [googleMapsKey]);

  // Térkép inicializálása
  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current || !window.google) return;
    
    try {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 47.4979, lng: 19.0402 },
        zoom: 7,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
    } catch (error) {
      console.error('Térkép inicializálási hiba:', error);
      setMapError(true);
      setTerkepMod(false);
    }
  };

  // Átvételi pontok betöltése a backendből (csak a szükséges mezők)
  useEffect(() => {
    if (szallitasMod && szallitasMod !== "hazhoz") {
      fetchAtveteliPontok();
    } else {
      setAtveteliPontok([]);
      setSzurtPontok([]);
      clearMarkers();
    }
  }, [szallitasMod]);

  const fetchAtveteliPontok = async () => {
    try {
      console.log(`Betöltés: ${API_BASE_URL}/api/atveteli-pontok?szallitasMod=${szallitasMod}`);
      const response = await fetch(`${API_BASE_URL}/api/atveteli-pontok?szallitasMod=${szallitasMod}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Betöltött átvételi pontok:', data);
      setAtveteliPontok(data);
      setSzurtPontok(data);
      
      // Városok listájának frissítése
      const uniqueCities = [...new Set(data.map(p => p.varos))].sort();
      setVarosok(uniqueCities);
      
      // Térkép frissítése (ha van)
      if (terkepMod && data.length > 0 && mapInstanceRef.current && window.google) {
        const firstWithCoords = data.find(p => p.lat && p.lng);
        if (firstWithCoords) {
          mapInstanceRef.current.setCenter({ lat: firstWithCoords.lat, lng: firstWithCoords.lng });
          mapInstanceRef.current.setZoom(10);
        }
        updateMapMarkers(data);
      }
    } catch (error) {
      console.error("Hiba az átvételi pontok betöltésekor:", error);
      setAtveteliPontok([]);
      setSzurtPontok([]);
    }
  };

  // Pontok szűrése keresés/város alapján
  useEffect(() => {
    let filtered = [...atveteliPontok];
    
    if (kereses) {
      filtered = filtered.filter(p => 
        p.nev?.toLowerCase().includes(kereses.toLowerCase()) ||
        p.cim?.toLowerCase().includes(kereses.toLowerCase()) ||
        p.varos?.toLowerCase().includes(kereses.toLowerCase())
      );
    }
    
    if (valasztottVaros) {
      filtered = filtered.filter(p => p.varos === valasztottVaros);
    }
    
    setSzurtPontok(filtered);
    
    // Frissítsük a térképet is a szűrt pontokkal (ha térkép mód van)
    if (terkepMod) {
      updateMapMarkers(filtered);
    }
  }, [kereses, valasztottVaros, atveteliPontok]);

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  const updateMapMarkers = (points) => {
    if (!mapInstanceRef.current || !window.google || !terkepMod) return;
    
    clearMarkers();
    
    points.forEach(point => {
      if (point.lat && point.lng) {
        const marker = new window.google.maps.Marker({
          position: { lat: point.lat, lng: point.lng },
          map: mapInstanceRef.current,
          title: point.nev,
          animation: window.google.maps.Animation.DROP
        });
        
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; min-width: 200px;">
              <h4 style="margin: 0 0 5px 0; color: #333;">${point.nev || ''}</h4>
              <p style="margin: 5px 0; color: #666;">${point.cim || ''}</p>
              <p style="margin: 5px 0; color: #666;">${point.varos || ''}, ${point.iranyitoszam || ''}</p>
              <button 
                onclick="window.selectPickupPoint(${point.id}, '${(point.nev || '').replace(/'/g, "\\'")}', '${(point.cim || '').replace(/'/g, "\\'")}')"
                style="
                  background: #7c3aed; 
                  color: white; 
                  border: none; 
                  padding: 5px 10px; 
                  border-radius: 5px; 
                  cursor: pointer;
                  margin-top: 5px;
                "
              >
                Kiválasztás
              </button>
            </div>
          `
        });
        
        marker.addListener('click', () => infoWindow.open(mapInstanceRef.current, marker));
        markersRef.current.push(marker);
      }
    });
  };

  // Globális függvény a pont kiválasztásához
  useEffect(() => {
    window.selectPickupPoint = (id, nev, cim) => {
      setSzallitasPont(id);
      setKivalasztottPont({ id, nev, cim });
      setHiba("");
    };
    
    return () => { delete window.selectPickupPoint; };
  }, []);

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

  const handleTovabb = async () => {
    setHiba("");
    
    if (!szamlazasiAdatok.nev || !szamlazasiAdatok.email || !szamlazasiAdatok.telefon) {
      setHiba("Kérlek töltsd ki a kötelező mezőket!");
      return;
    }
    if (!szallitasMod) {
      setHiba("Kérlek válassz szállítási módot!");
      return;
    }
    if (szallitasMod !== "hazhoz" && !szallitasPont) {
      setHiba("Kérlek válassz átvételi pontot!");
      return;
    }
    if (!cartItems || cartItems.length === 0) {
      setHiba("A kosár üres!");
      return;
    }

    setBetoltes(true);

    try {
      // Számlázási cím mentése
      const szamlazasResponse = await fetch(`${API_BASE_URL}/api/szamlazasi-cim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(szamlazasiAdatok)
      });
      if (!szamlazasResponse.ok) throw new Error("Számlázási hiba");
      const szamlazasAdat = await szamlazasResponse.json();

      // Szállítási cím mentése
      const szallitasiCim = samlaEgyezik ? {
        iranyitoszam: szamlazasiAdatok.iranyitoszam,
        varos: szamlazasiAdatok.varos,
        cim: szamlazasiAdatok.cim
      } : szallitasiAdatok;
      
      const szallitasResponse = await fetch(`${API_BASE_URL}/api/szallitasi-cim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(szallitasiCim)
      });
      if (!szallitasResponse.ok) throw new Error("Szállítási hiba");
      const szallitasAdat = await szallitasResponse.json();

      // Rendelés mentése
      const szallitasAr = getSzallitasAr();
      const vegosszeg = cartTotal + szallitasAr;

      const kivalasztott = szurtPontok.find(p => p.id == szallitasPont);
      
      const termekekARendeleshez = cartItems.map(item => ({
        id: item.id,
        nev: item.nev,
        ar: item.akcios_ar ?? item.ar,
        mennyiseg: item.quantity || 1
      }));

      const rendelesResponse = await fetch(`${API_BASE_URL}/api/rendeles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          szallitasMod,
          szallitasPont: szallitasMod !== "hazhoz" ? szallitasPont : null,
          szallitasPontNev: kivalasztott?.nev,
          szallitasPontCim: kivalasztott?.cim,
          szallitasPontLat: kivalasztott?.lat || null,
          szallitasPontLng: kivalasztott?.lng || null,
          szamlazasiCimId: szamlazasAdat.id,
          szallitasiCimId: szallitasAdat.id,
          termekek: termekekARendeleshez,
          reszosszeg: cartTotal,
          szallitasKoltseg: szallitasAr,
          vegosszeg,
          statusz: "fizetes_folyamatban"
        })
      });
      if (!rendelesResponse.ok) throw new Error("Rendelési hiba");
      const rendelesEredmeny = await rendelesResponse.json();
      
      localStorage.setItem("rendelesAdatok", JSON.stringify({
        rendelesId: rendelesEredmeny.id,
        rendelesSzam: rendelesEredmeny.rendelesSzam,
        szallitasMod,
        szallitasPont: kivalasztott,
        szamlazasiAdatok,
        szallitasiAdatok: szallitasiCim,
        termekek: cartItems,
        vegosszeg
      }));
      
      navigate("/fizetes");
    } catch (error) {
      setHiba(error.message || "Hiba történt!");
    } finally {
      setBetoltes(false);
    }
  };

  const getSzallitasAr = () => {
    if (cartTotal > 50000) return 0;
    const mod = szallitasiModok.find(m => m.id === szallitasMod);
    return mod ? mod.ar : 1990;
  };

  // Nézet váltás funkció
  const toggleViewMode = () => {
    if (!terkepMod && googleMapsLoaded && !mapError) {
      setTerkepMod(true);
      setTimeout(() => {
        initMap();
        updateMapMarkers(szurtPontok);
      }, 100);
    } else {
      setTerkepMod(false);
      clearMarkers();
    }
  };

  return (
    <div className="rendeles-container">
      <h1>Rendelés folyamata</h1>
      
      {hiba && <div className="hiba-uzenet" style={{ marginBottom: '20px', background: '#ff4444', color: 'white', padding: '10px', borderRadius: '5px' }}>{hiba}</div>}
      
      <div className="rendeles-grid">
        <div className="rendeles-form">
          {/* Számlázási adatok */}
          <div className="form-section">
            <h2>SZÁMLÁZÁSI ADATOK</h2>
            <div className="form-row">
              <input type="text" name="nev" placeholder="Név *" value={szamlazasiAdatok.nev} onChange={handleSzamlazasiChange} disabled={betoltes} />
              <input type="email" name="email" placeholder="Email *" value={szamlazasiAdatok.email} onChange={handleSzamlazasiChange} disabled={betoltes} />
            </div>
            <div className="form-row">
              <input type="tel" name="telefon" placeholder="Telefonszám *" value={szamlazasiAdatok.telefon} onChange={handleSzamlazasiChange} disabled={betoltes} />
              <input type="text" name="cegnev" placeholder="Cégnév (opcionális)" value={szamlazasiAdatok.cegnev} onChange={handleSzamlazasiChange} disabled={betoltes} />
            </div>
            <div className="form-row">
              <input type="text" name="adoszam" placeholder="Adószám (opcionális)" value={szamlazasiAdatok.adoszam} onChange={handleSzamlazasiChange} disabled={betoltes} />
              <input type="text" name="iranyitoszam" placeholder="Irányítószám" value={szamlazasiAdatok.iranyitoszam} onChange={handleSzamlazasiChange} disabled={betoltes} />
            </div>
            <div className="form-row">
              <input type="text" name="varos" placeholder="Város" value={szamlazasiAdatok.varos} onChange={handleSzamlazasiChange} disabled={betoltes} />
              <input type="text" name="cim" placeholder="Cím" value={szamlazasiAdatok.cim} onChange={handleSzamlazasiChange} disabled={betoltes} />
            </div>
          </div>

          {/* Szállítási adatok */}
          <div className="form-section">
            <label className="checkbox-label">
              <input type="checkbox" checked={samlaEgyezik} onChange={(e) => setSamlaEgyezik(e.target.checked)} disabled={betoltes} />
              Szállítási cím megegyezik a számlázási címmel
            </label>
            
            {!samlaEgyezik && (
              <div className="szallitasi-resz">
                <h2>SZÁLLÍTÁSI ADATOK</h2>
                <div className="form-row">
                  <input type="text" name="iranyitoszam" placeholder="Irányítószám" value={szallitasiAdatok.iranyitoszam} onChange={handleSzallitasiChange} disabled={betoltes} />
                  <input type="text" name="varos" placeholder="Város" value={szallitasiAdatok.varos} onChange={handleSzallitasiChange} disabled={betoltes} />
                </div>
                <input type="text" name="cim" placeholder="Cím" value={szallitasiAdatok.cim} onChange={handleSzallitasiChange} disabled={betoltes} />
              </div>
            )}
          </div>

          {/* Szállítási mód */}
          <div className="form-section">
            <h2>VÁLASSZ SZÁLLÍTÁSI MÓDOT</h2>
            <div className="szallitas-options">
              {szallitasiModok.map((mod) => (
                <label key={mod.id} className="szallitas-card">
                  <input type="radio" name="szallitas" value={mod.id} checked={szallitasMod === mod.id} 
                    onChange={(e) => { setSzallitasMod(e.target.value); setSzallitasPont(""); setKivalasztottPont(null); }} disabled={betoltes} />
                  <div>
                    <strong>{mod.icon} {mod.nev}</strong>
                    <span>{cartTotal > 50000 && mod.id !== "hazhoz" ? "Ingyenes" : `${mod.ar.toLocaleString()} Ft`}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Átvételi pontok - TÉRKÉP VAGY LISTA NÉZET */}
          {szallitasMod !== "hazhoz" && (
            <div className="form-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0 }}>VÁLASSZ ÁTVÉTELI PONTOT</h2>
                {googleMapsLoaded && !mapError && (
                  <button 
                    onClick={toggleViewMode}
                    style={{
                      background: terkepMod ? '#374151' : '#7c3aed',
                      color: 'white',
                      border: 'none',
                      padding: '8px 15px',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    {terkepMod ? '📋 Váltás lista nézetre' : '🗺️ Váltás térkép nézetre'}
                  </button>
                )}
              </div>
              
              {/* Szűrők */}
              <div className="filter-row">
                <input 
                  type="text" 
                  placeholder="🔍 Keresés névre, címre..." 
                  value={kereses} 
                  onChange={(e) => setKereses(e.target.value)} 
                  className="search-input" 
                />
                <select value={valasztottVaros} onChange={(e) => setValasztottVaros(e.target.value)} className="city-select">
                  <option value="">Összes város ({varosok.length})</option>
                  {varosok.map(varos => <option key={varos} value={varos}>{varos}</option>)}
                </select>
              </div>
              
              {/* TÉRKÉP NÉZET */}
              {terkepMod && googleMapsLoaded && !mapError && (
                <>
                  <div ref={mapRef} style={{ width: '100%', height: '400px', borderRadius: '8px', marginBottom: '15px' }}></div>
                  {kivalasztottPont && (
                    <div className="selected-point">
                      <strong>✅ Kiválasztott pont:</strong>
                      <p>{kivalasztottPont.nev}</p>
                      <p>{kivalasztottPont.cim}</p>
                    </div>
                  )}
                </>
              )}
              
              {/* LISTA NÉZET - Mindig látszik, függetlenül a térkép állapotától */}
              <div className="points-list">
                <h3>Átvételi pontok ({szurtPontok.length} db)</h3>
                <div className="points-grid">
                  {szurtPontok.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                      Nincsenek elérhető átvételi pontok ehhez a szállítási módhoz
                    </div>
                  ) : (
                    szurtPontok.map(pont => (
                      <div 
                        key={pont.id} 
                        className={`point-card ${szallitasPont == pont.id ? 'selected' : ''}`} 
                        onClick={() => { 
                          setSzallitasPont(pont.id); 
                          setKivalasztottPont({ id: pont.id, nev: pont.nev, cim: pont.cim });
                        }}
                      >
                        <div className="point-name">{pont.nev}</div>
                        <div className="point-address">{pont.cim}</div>
                        <div className="point-city">{pont.varos}, {pont.iranyitoszam}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <button className="tovabb-gomb" onClick={handleTovabb} disabled={betoltes}>
            {betoltes ? "Feldolgozás..." : "Tovább a fizetéshez →"}
          </button>
        </div>

        {/* Kosár összegzés */}
        <div className="rendeles-osszegzes">
          <h2>Rendelés összegzése</h2>
          <div className="osszegzes-item">
            <span>Termékek összesen:</span>
            <span>{cartTotal.toLocaleString()} Ft</span>
          </div>
          <div className="osszegzes-item">
            <span>Szállítási díj:</span>
            <span>{getSzallitasAr() === 0 ? "Ingyenes" : getSzallitasAr().toLocaleString() + " Ft"}</span>
          </div>
          <div className="osszegzes-item total">
            <span>Összesen:</span>
            <span>{(cartTotal + getSzallitasAr()).toLocaleString()} Ft</span>
          </div>
          <button className="vissza-gomb" onClick={() => navigate("/kosar")} disabled={betoltes}>
            ← Vissza a kosárhoz
          </button>
        </div>
      </div>
    </div>
  );
};

export default Rendeles;