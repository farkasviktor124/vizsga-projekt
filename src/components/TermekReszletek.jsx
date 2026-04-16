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
  const [form, setForm] = useState(product);
  const [preview, setPreview] = useState(product?.kep);

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

  // 🔧 mezők kezelése
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🖼 kép csere
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm({ ...form, kep: file });
    setPreview(URL.createObjectURL(file));
  };

  // 💾 mentés backendbe
  const handleSave = async () => {
    const formData = new FormData();

    formData.append("nev", form.nev);
    formData.append("ar", form.ar);
    formData.append("allapot", form.allapot);
    formData.append("evjarat", form.evjarat);
    formData.append("gyarto", form.gyarto);
    formData.append("arus", form.arus);
    formData.append("termekTipus", form.termekTipus);
    formData.append("leiras", form.leiras);

    if (form.kep instanceof File) {
      formData.append("kep", form.kep);
    }

    try {
      const res = await fetch(
        `http://localhost:4000/termekek/${product.id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (res.ok) {
        setEditMode(false);
        alert("Sikeres mentés!");
      } else {
        alert("Hiba történt a mentésnél!");
      }
    } catch (err) {
      alert("Hálózati hiba!");
    }
  };

  const handleAddToCart = () => {
    addToCart({ ...form });
    navigate("/kosar");
  };

  const defaultImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3Ctext x='10' y='55' fill='%2366f0ff' font-family='monospace' font-size='14'%3ENo img%3C/text%3E%3C/svg%3E";

  return (
    <div className="termek-reszletek-container">

      {/* Vissza gomb */}
      <button className="vissza-gomb" onClick={() => navigate(-1)}>
        ← Vissza
      </button>

      <div className="termek-reszletek">

        {/* BAL OLDAL */}
        <div className="bal-oldal">

          {/* KÉP */}
          <div className="termek-kep-nagy" style={{ position: "relative" }}>
            <img src={preview || form.kep || defaultImage} alt={form.nev} />

            {/* Kép csere */}
            {editMode && (
              <>
                <button
                  className="kep-edit-btn"
                  onClick={() => fileRef.current.click()}
                >
                  📷 Kép csere
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

            {/* ✏️ edit ikon */}
            <button
              className="edit-ikon"
              onClick={() => setEditMode(!editMode)}
            >
              ✏️
            </button>
          </div>

          {/* NÉV */}
          {editMode ? (
            <input
              className="termek-input"
              name="nev"
              value={form.nev}
              onChange={handleChange}
            />
          ) : (
            <h2 className="termek-cim">{form.nev}</h2>
          )}

          {/* LEÍRÁS */}
          {editMode ? (
            <textarea
              className="termek-textarea"
              name="leiras"
              value={form.leiras}
              onChange={handleChange}
            />
          ) : (
            <p className="termek-leiras">{form.leiras}</p>
          )}

        </div>

        {/* JOBB OLDAL */}
        <div className="jobb-oldal">

          {/* ÁR */}
          <div className="ar-reszletek">
            {editMode ? (
              <input
                className="termek-input"
                name="ar"
                value={form.ar}
                onChange={handleChange}
              />
            ) : (
              <div className="aktualis-ar">{form.ar} Ft</div>
            )}
          </div>

          {/* INFÓK */}
          <div className="termek-infok">
            {editMode ? (
              <>
                <input className="termek-input" name="allapot" value={form.allapot} onChange={handleChange} />
                <input className="termek-input" name="termekTipus" value={form.termekTipus} onChange={handleChange} />
                <input className="termek-input" name="evjarat" value={form.evjarat} onChange={handleChange} />
                <input className="termek-input" name="gyarto" value={form.gyarto} onChange={handleChange} />
                <input className="termek-input" name="arus" value={form.arus} onChange={handleChange} />
              </>
            ) : (
              <>
                <p><strong>Állapot:</strong> {form.allapot}</p>
                <p><strong>Típus:</strong> {form.termekTipus}</p>
                <p><strong>Évjárat:</strong> {form.evjarat}</p>
                <p><strong>Gyártó:</strong> {form.gyarto}</p>
                <p><strong>Árus:</strong> {form.arus}</p>
              </>
            )}
          </div>

          {/* KOSÁR */}
          <button className="kosar-gomb-nagy" onClick={handleAddToCart}>
            🛒 Kosárba
          </button>

          {/* MENTÉS */}
          {editMode && (
            <button className="mentes-gomb" onClick={handleSave}>
              💾 Mentés
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default TermekReszletek;