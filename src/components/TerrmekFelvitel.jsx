// src/components/TermekFelvitel.jsx
import { useState } from "react";
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
  const [termekTipus, setTermekTipus] = useState(""); 
  const [leiras, setLeiras] = useState("");           
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const kuldes = async (e) => {
    e.preventDefault();
    
    if (!nev || !ar) {
      setMessage("❌ Név és ár megadása kötelező!");
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
    formData.append("termekTipus", termekTipus);
    formData.append("leiras", leiras);
    if (kep) formData.append("kep", kep);

    try {
      const response = await fetch("http://localhost:4000/termekek", {
        method: "POST",
        body: formData,
      });

      // Először megpróbáljuk JSON-ként értelmezni a választ
      let data;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Ha nem JSON, akkor szövegként olvassuk
        const textResponse = await response.text();
        console.error("Nem JSON válasz érkezett:", textResponse);
        
        // Ha a válasz eleje "//" - val kezdődik, valószínűleg HTML vagy JS fájlt kaptunk
        if (textResponse.trim().startsWith("//")) {
          throw new Error("A szerver nem JSON választ küldött. Ellenőrizd, hogy a backend helyesen fut-e a http://localhost:4000 címen!");
        } else {
          throw new Error(`A szerver válasza: ${textResponse.substring(0, 100)}...`);
        }
      }

      if (response.ok) {
        setMessage("✅ " + (data.message || "Termék sikeresen hozzáadva!"));
        // Űrlap resetelése
        setNev("");
        setAr("");
        setAllapot("Új");
        setEvjarat("");
        setGyarto("");
        setArus("");
        setTermekTipus("");
        setLeiras("");
        setKep(null);
        
        setTimeout(() => navigate("/"), 2000);
      } else {
        setMessage("❌ " + (data.message || data.error || "Ismeretlen hiba történt"));
      }
    } catch (error) {
      console.error("HIBA:", error);
      
      // Részletesebb hibaüzenet a felhasználónak
      if (error.message.includes("Nem JSON válasz")) {
        setMessage("❌ " + error.message);
      } else if (error.message.includes("Failed to fetch")) {
        setMessage("❌ Nem sikerült csatlakozni a szerverhez! Ellenőrizd, hogy a backend fut-e a http://localhost:4000 címen.");
      } else {
        setMessage("❌ Hiba történt: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="termekfelvitel-container">
      <h2>Termék felvitel</h2>
      
      <form onSubmit={kuldes}>
        <input 
          placeholder="Név *" 
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

        {/* Állapot radio gombok */}
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
        <input 
          placeholder="Árus" 
          value={arus} 
          onChange={e => setArus(e.target.value)} 
        />

        {/* Új mezők: Termék típus és leírás */}
        <input
          placeholder="Termék típusa"
          value={termekTipus}
          onChange={(e) => setTermekTipus(e.target.value)}
        />
        <textarea
          placeholder="Leírás"
          value={leiras}
          onChange={(e) => setLeiras(e.target.value)}
          rows={4}
        />
        
        {/* Kép feltöltés "+" gombbal */}
        <label className="file-upload">
          <span>+ Kép feltöltése</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setKep(e.target.files[0]);
              }
            }}
            style={{ display: 'none' }}
          />
        </label>
        {kep && <span style={{ marginLeft: "10px" }}>{kep.name}</span>}
        
        <button type="submit" disabled={loading}>
          {loading ? "Feldolgozás..." : "Mentés"}
        </button>

        {message && (
          <div className="message" style={{
            marginTop: "10px",
            padding: "10px",
            borderRadius: "5px",
            backgroundColor: message.includes("✅") ? "#d4edda" : "#f8d7da",
            color: message.includes("✅") ? "#155724" : "#721c24",
            border: message.includes("✅") ? "1px solid #c3e6cb" : "1px solid #f5c6cb"
          }}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default TermekFelvitel;