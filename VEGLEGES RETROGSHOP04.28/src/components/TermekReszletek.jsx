// src/components/TermekReszletek.jsx
import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext.jsx";
import "./TermekReszletek.css";

const TermekReszletek = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const product = location.state?.product;
  const fileRef = useRef(null);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ 
    ...product, 
    keszlet: product?.keszlet ?? 0 
  });
  const [preview, setPreview] = useState(null);
  const [mentesAllapot, setMentesAllapot] = useState("");

  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === "admin";

  // Bejelentkezés ellenőrzése
  const isLoggedIn = () => {
    const user = localStorage.getItem("user");
    return user !== null;
  };

  const defaultImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3Ctext x='10' y='55' fill='%2366f0ff' font-family='monospace' font-size='14'%3ENo img%3C/text%3E%3C/svg%3E";

  const getImageUrl = (kep) => {
    if (!kep) return defaultImage;
    if (kep.startsWith("http") || kep.startsWith("blob") || kep.startsWith("data")) return kep;
    if (kep.startsWith("/uploads/")) return `http://localhost:4000${kep}`;
    return `http://localhost:4000/uploads/${kep}`;
  };

  if (!product) {
    return (
      <div className="termek-reszletek-container">
        <h2>Termék nem található</h2>
        <button className="vissza-gomb" onClick={() => navigate("/")}>
          Vissza
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, kep: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("nev", form.nev || "");
    formData.append("ar", form.ar || "");
    formData.append("allapot", form.allapot || "");
    formData.append("evjarat", form.evjarat || "");
    formData.append("gyarto", form.gyarto || "");
    formData.append("arus", form.arus || "");
    formData.append("termekTipus", form.termektipus || "");
    formData.append("leiras", form.leiras || "");
    formData.append("keszlet", form.keszlet ?? 0);

    if (form.kep instanceof File) {
      formData.append("kep", form.kep);
    }

    try {
      setMentesAllapot("mentés...");
      const res = await fetch(`http://localhost:4000/termekek/${product.id}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        if (form.kep instanceof File) {
          const updatedProduct = await res.json();
          setForm((prev) => ({ ...prev, kep: updatedProduct.kep }));
          setPreview(null);
        }
        setMentesAllapot("mentve ✓");
        setEditMode(false);
        setTimeout(() => setMentesAllapot(""), 2000);
      } else {
        setMentesAllapot("hiba!");
      }
    } catch (err) {
      setMentesAllapot("hiba!");
    }
  };

  const handleAddToCart = () => {
    // 🔐 BEJELENTKEZÉS ELLENŐRZÉS
    if (!isLoggedIn()) {
      const userConfirmed = window.confirm(
        "🔐 **BEJELENTKEZÉS SZÜKSÉGES!**\n\n" +
        "Ahhoz, hogy terméket rakj a kosárba, kérlek jelentkezz be vagy regisztrálj!\n\n" +
        "✨ **Miért éri meg regisztrálni?**\n" +
        "• 📦 Rendeléseid nyomon követése\n" +
        "• ⚡ Gyorsabb vásárlás legközelebb\n" +
        "• 🎁 Személyre szabott ajánlatok\n" +
        "• 🔔 Akciókról elsőként értesülsz\n\n" +
        "✅ Kattints az 'OK' gombra a bejelentkezéshez!\n" +
        "📝 Még nincs fiókod? Regisztrálj a Bejelentkezés oldalon!"
      );
      
      if (userConfirmed) {
        navigate("/login");
      }
      return;
    }

    const keszlet = form.keszlet ?? 0;
    if (keszlet <= 0) {
      alert("❌ Sajnáljuk, ez a termék jelenleg nincs készleten!");
      return;
    }
    
    addToCart({ ...form });
    alert(`✅ ${form.nev} sikeresen a kosárba került!`);
    navigate("/kosar");
  };

  const tipusErtek =
    form.termektipus && form.termektipus !== "undefined"
      ? form.termektipus
      : "-";

  const keszlet = form.keszlet ?? 0;
  const nincsKeszleten = keszlet <= 0;

  // Készlet megjelenítő függvény
  const renderKeszlet = () => {
    if (keszlet === 0) {
      return <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '5px' }}>❌ ELFOGYOTT</span>;
    } else if (keszlet <= 5) {
      return <span style={{ color: '#f59e0b', fontWeight: 'bold', marginLeft: '5px' }}>⚠️ Utolsó {keszlet} db!</span>;
    } else {
      return <span style={{ color: '#22c55e', fontWeight: 'bold', marginLeft: '5px' }}>✅ {keszlet} db raktáron</span>;
    }
  };

  return (
    <div className="termek-reszletek-container">
      <button className="vissza-gomb" onClick={() => navigate(-1)}>
        ← Vissza
      </button>

      <div className="termek-reszletek">
        <div className="bal-oldal">
          <div className="termek-kep-nagy" style={{ position: "relative" }}>
            <img
              src={preview || getImageUrl(form.kep)}
              alt={form.nev}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultImage;
              }}
            />
            {keszlet <= 0 && (
              <div className="out-of-stock-badge-large">ELFOGYOTT</div>
            )}

            {editMode && isAdmin && (
              <>
                <button
                  className="kep-edit-btn"
                  onClick={() => fileRef.current.click()}
                >
                  Kép csere
                </button>
                <input
                  type="file"
                  ref={fileRef}
                  className="file-hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </>
            )}

            {isAdmin && (
              <button
                className="edit-ikon"
                onClick={() => setEditMode(!editMode)}
              >
                ✏️
              </button>
            )}
          </div>

          {editMode && isAdmin ? (
            <input
              className="termek-input"
              name="nev"
              value={form.nev || ""}
              onChange={handleChange}
            />
          ) : (
            <h2 className="termek-cim">{form.nev}</h2>
          )}

          {editMode && isAdmin ? (
            <textarea
              className="termek-textarea"
              name="leiras"
              value={form.leiras || ""}
              onChange={handleChange}
            />
          ) : (
            <p className="termek-leiras">{form.leiras}</p>
          )}
        </div>

        <div className="jobb-oldal">
          <div className="ar-reszletek">
            {editMode && isAdmin ? (
              <input
                className="termek-input"
                name="ar"
                value={form.ar || ""}
                onChange={handleChange}
              />
            ) : (
              <div className="aktualis-ar">{form.ar} Ft</div>
            )}
          </div>

          <div className="termek-infok">
            {editMode && isAdmin ? (
              <>
                <input
                  className="termek-input"
                  name="nev"
                  value={form.nev || ""}
                  onChange={handleChange}
                  placeholder="Név"
                />
                <input
                  className="termek-input"
                  name="ar"
                  value={form.ar || ""}
                  onChange={handleChange}
                  placeholder="Ár"
                />
                <input
                  className="termek-input"
                  name="allapot"
                  value={form.allapot || ""}
                  onChange={handleChange}
                  placeholder="Állapot"
                />
                <input
                  className="termek-input"
                  type="number"
                  name="keszlet"
                  value={form.keszlet ?? 0}
                  onChange={handleChange}
                  placeholder="Készlet (db)"
                  min="0"
                />
                <input
                  className="termek-input"
                  name="termektipus"
                  value={form.termektipus && form.termektipus !== "undefined" ? form.termektipus : ""}
                  onChange={handleChange}
                  placeholder="Típus"
                />
                <input
                  className="termek-input"
                  name="evjarat"
                  value={form.evjarat || ""}
                  onChange={handleChange}
                  placeholder="Évjárat"
                />
                <input
                  className="termek-input"
                  name="gyarto"
                  value={form.gyarto || ""}
                  onChange={handleChange}
                  placeholder="Gyártó"
                />
                <input
                  className="termek-input"
                  name="arus"
                  value={form.arus || ""}
                  onChange={handleChange}
                  placeholder="Árus"
                />
              </>
            ) : (
              <>
                <p><strong>Állapot:</strong> {form.allapot || "-"}</p>
                <p><strong>Típus:</strong> {tipusErtek}</p>
                <p><strong>Évjárat:</strong> {form.evjarat || "-"}</p>
                <p><strong>Gyártó:</strong> {form.gyarto || "-"}</p>
                <p><strong>Árus:</strong> {form.arus || "-"}</p>
                <p>
                  <strong>📦 Készlet:</strong> {renderKeszlet()}
                </p>
              </>
            )}
          </div>

          {/* Kosárba gomb */}
          <div className="product-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              className="cart-btn"
              style={{ 
                fontSize: '100%',
                opacity: nincsKeszleten ? 0.5 : 1,
                cursor: nincsKeszleten ? "not-allowed" : "pointer",
                padding: '12px 24px',
                backgroundColor: nincsKeszleten ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontWeight: 'bold'
              }}
              onClick={handleAddToCart}
              disabled={nincsKeszleten}
            >
              🛒 Kosárba {nincsKeszleten && "(Nincs készleten)"}
            </button>
          </div>

          {editMode && isAdmin && (
            <button className="mentes-gomb" onClick={handleSave}>
              💾 Mentés
            </button>
          )}

          {mentesAllapot && (
            <div
              style={{
                marginTop: "8px",
                padding: "8px 12px",
                borderRadius: "6px",
                textAlign: "center",
                fontWeight: "bold",
                color: mentesAllapot === "mentve ✓" ? "#4ade80"
                      : mentesAllapot === "hiba!" ? "#f87171"
                      : "#a0f0ff",
                border: `1px solid ${
                  mentesAllapot === "mentve ✓" ? "#4ade80"
                  : mentesAllapot === "hiba!" ? "#f87171"
                  : "#a0f0ff"
                }`,
              }}
            >
              {mentesAllapot}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermekReszletek;