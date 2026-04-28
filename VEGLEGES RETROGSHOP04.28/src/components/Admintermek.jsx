import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "./CartContext.jsx";

function Admintermek() {
  const [termekek, setTermekek] = useState([]);
  const [szurtTermekek, setSzurtTermekek] = useState([]);

  const navigate = useNavigate();
  const { addToCart } = useCart();

  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === "admin";

  const defaultImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%23333'/%3E%3Ctext x='5' y='35' fill='%2366f0ff' font-family='monospace' font-size='10'%3ENo img%3C/text%3E%3C/svg%3E";

  const getImageUrl = (kep) => {
    if (!kep) return defaultImage;
    if (kep.startsWith("http")) return kep;
    return `http://localhost:4000${kep}`;
  };

  useEffect(() => {
    fetch("http://localhost:4000/termekek")
      .then(res => {
        if (!res.ok) throw new Error("Hálózati hiba");
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
      .catch(err => console.error("Hiba:", err));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Biztosan törlöd ezt a terméket?")) return;
    try {
      const response = await fetch(`http://localhost:4000/termekek/${id}`, { method: "DELETE" });
      if (response.ok) {
        setTermekek(prev => prev.filter(t => t.id !== id));
        setSzurtTermekek(prev => prev.filter(t => t.id !== id));
      } else {
        alert("Hiba a törlés során!");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
  };

  const handleAddToCart = (termek) => {
    addToCart({ ...termek });
  };

  const handleRowClick = (termek) => {
    const slug = termek.nev.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    navigate(`/termek/${slug}`, { state: { product: termek } });
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <h1 style={{ margin: 0 }}>Termékek</h1>
        <Link
          to="/termekek"
          style={{
            padding: "8px 18px",
            background: "#1e3a5f",
            color: "#66f0ff",
            border: "1px solid #66f0ff",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "14px"
          }}
        >
          🔗 Ugrás a Termékek oldalra
        </Link>
      </div>

      <div style={{ marginBottom: "16px", color: "#888" }}>
        Találatok: <strong style={{ color: "white" }}>{szurtTermekek.length}</strong>
        {isAdmin && (
          <span style={{
            marginLeft: "12px",
            background: "#7c3aed22", border: "1px solid #7c3aed",
            color: "#a78bfa", padding: "4px 10px", borderRadius: "6px", fontSize: "13px"
          }}>
            🛡️ Admin mód
          </span>
        )}
      </div>

      {szurtTermekek.length === 0 ? (
        <p style={{ color: "#888" }}>Nincs találat.</p>
      ) : (
        <table border="1" style={{ width: "100%", color: "white", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#333" }}>
              <th style={{ padding: "10px" }}>Kép</th>
              <th style={{ padding: "10px" }}>Név</th>
              <th style={{ padding: "10px" }}>Ár</th>
              <th style={{ padding: "10px" }}>Állapot</th>
              <th style={{ padding: "10px" }}>Évjárat</th>
              <th style={{ padding: "10px" }}>Típus</th>
              <th style={{ padding: "10px" }}>Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {szurtTermekek.map(t => (
              <tr
                key={t.id}
                style={{ cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "#1e1e2e"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "8px", textAlign: "center" }} onClick={() => handleRowClick(t)}>
                  <img
                    src={getImageUrl(t.kep)}
                    alt={t.nev}
                    style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }}
                    onError={e => { e.target.onerror = null; e.target.src = defaultImage; }}
                  />
                </td>
                <td style={{ padding: "8px", fontWeight: "bold" }} onClick={() => handleRowClick(t)}>
                  {t.nev}
                </td>
                <td style={{ padding: "8px", textAlign: "right", color: "#66f0ff" }} onClick={() => handleRowClick(t)}>
                  {(t.ar || 0).toLocaleString()} Ft
                </td>
                <td style={{ padding: "8px", textAlign: "center" }} onClick={() => handleRowClick(t)}>
                  <span style={{
                    background: t.allapot === "Új" ? "#14532d" : "#1e3a5f",
                    padding: "2px 8px", borderRadius: "4px", fontSize: "12px"
                  }}>
                    {t.allapot || "-"}
                  </span>
                </td>
                <td style={{ padding: "8px", textAlign: "center" }} onClick={() => handleRowClick(t)}>
                  {t.evjarat || "-"}
                </td>
                <td style={{ padding: "8px", textAlign: "center" }} onClick={() => handleRowClick(t)}>
                  {t.termekTipus || "-"}
                </td>
                <td style={{ padding: "8px", textAlign: "center" }}>
                  {isAdmin ? (
                    <button onClick={() => handleDelete(t.id)} style={{
                      background: "#7f1d1d", color: "#fca5a5",
                      border: "1px solid #ef4444", padding: "4px 12px",
                      borderRadius: "4px", cursor: "pointer", fontWeight: "bold"
                    }}>
                      🗑️ Törlés
                    </button>
                  ) : (
                    <button onClick={() => handleAddToCart(t)} style={{
                      background: "#1e3a5f", color: "#66f0ff",
                      border: "1px solid #66f0ff", padding: "4px 12px",
                      borderRadius: "4px", cursor: "pointer", fontWeight: "bold"
                    }}>
                      🛒 Kosárba
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Admintermek;