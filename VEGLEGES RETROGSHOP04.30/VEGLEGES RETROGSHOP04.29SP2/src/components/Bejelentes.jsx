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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:4000/api/bejelentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Bejelentés elküldve:", formData);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        setFormData({ nev: "", email: "", tipus: "hiba", cim: "", leiras: "" });
      } else {
        setError(result.error || "Hiba történt!");
      }
    } catch (err) {
      setError("Hálózati hiba!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bejelentes-container">
      <div className="bejelentes-card">
        <h1 className="bejelentes-title"> Bejelentés</h1>
        <p className="bejelentes-subtitle">Itt jelezheted a problémákat, hibákat vagy észrevételeidet.</p>

        {submitted && (
          <div className="success-message">
            ✅ Köszönjük! Bejelentésed elküldtük.
          </div>
        )}

        {error && (
          <div className="error-message">
            ❌ {error}
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Típus *</label>
            <select 
              name="tipus" 
              value={formData.tipus} 
              onChange={handleChange} 
              className="form-select"
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            ></textarea>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Küldés..." : "Bejelentés elküldése"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Bejelentes;