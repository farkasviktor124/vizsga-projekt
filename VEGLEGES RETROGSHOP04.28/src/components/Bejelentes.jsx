import React, { useState } from "react";
import "./BejelentesStyle.css";

const Bejelentes = () => {
  const [formData, setFormData] = useState({
    nev: "",
    email: "",
    tipus: "hiba",
    cim: "",
    leiras: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Bejelentés elküldve:", formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ nev: "", email: "", tipus: "hiba", cim: "", leiras: "" });
  };

  return (
    <div className="bejelentes-container">
      <div className="bejelentes-card">
        <h1 className="bejelentes-title">📝 Bejelentés</h1>
        <p className="bejelentes-subtitle">Itt jelezheted a problémákat, hibákat vagy észrevételeidet.</p>

        {submitted && (
          <div className="success-message">
            ✅ Köszönjük! Bejelentésed elküldtük.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Neved *</label>
            <input 
              type="text" 
              name="nev" 
              value={formData.nev} 
              onChange={handleChange} 
              required 
              className="form-input" 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="form-input" 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Típus *</label>
            <select 
              name="tipus" 
              value={formData.tipus} 
              onChange={handleChange} 
              className="form-select"
            >
              <option value="hiba">Hibajelentés</option>
              <option value="termek">Termékkel kapcsolatos</option>
              <option value="szallitas">Szállítási probléma</option>
              <option value="fizetes">Fizetési probléma</option>
              <option value="egyeb">Egyéb</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tárgy *</label>
            <input 
              type="text" 
              name="cim" 
              value={formData.cim} 
              onChange={handleChange} 
              required 
              className="form-input" 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Leírás *</label>
            <textarea 
              name="leiras" 
              rows="4" 
              value={formData.leiras} 
              onChange={handleChange} 
              required 
              className="form-textarea"
            ></textarea>
          </div>

          <button type="submit" className="submit-button">
            Bejelentés elküldése
          </button>
        </form>
      </div>
    </div>
  );
};

export default Bejelentes;