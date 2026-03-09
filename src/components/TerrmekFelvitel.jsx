
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function TermekFelvitel() {
  const [nev, setNev] = useState("");
  const [ar, setAr] = useState("");
  const [allapot, setAllapot] = useState("");
  const [evjarat, setEvjarat] = useState("");
  const [gyarto, setGyarto] = useState("");
  const [arus, setArus] = useState("");
  const [kep, setKep] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const kuldes = async (e) => {
    e.preventDefault();
    
    // Ellenőrzés
    if (!nev || !ar) {
      setMessage(" Név és ár megadása kötelező!");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/termekek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nev, ar, allapot, evjarat, gyarto, arus, kep }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(" " + data.message);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setMessage(" " + (data.message || "Ismeretlen hiba"));
      }
    } catch (error) {
      console.error("HIBA:", error);
      setMessage(" Hálózati hiba! Ellenőrizd, hogy fut-e a backend.");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h2>Termék felvitel</h2>
      
      <form onSubmit={kuldes} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
        <input 
          placeholder="Állapot" 
          value={allapot} 
          onChange={e => setAllapot(e.target.value)} 
        />
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
        <input
          placeholder="Kép URL (pl. https://...)"
          value={kep}
          onChange={e => setKep(e.target.value)}
        />
        
        <button type="submit">Mentés</button>
        
        {message && (
          <div style={{ 
            marginTop: "10px", 
            padding: "10px", 
            background: "#333", 
            color: message.includes("✅") ? "lightgreen" : "#ff6b6b",
            textAlign: "center" 
          }}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default TermekFelvitel;