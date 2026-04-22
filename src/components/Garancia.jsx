// src/components/Garancia.jsx
import React, { useState } from "react";
import "./GaranciaStyle.css";

const Garancia = () => {
  const [formData, setFormData] = useState({
    nev: "",
    email: "",
    termekNev: "",
    datum: "",
    problema: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Garancia igény beadva:", formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ nev: "", email: "", termekNev: "", datum: "", problema: "" });
  };

  return (
    <div className="garancia-container">
      <div className="garancia-card">
        <h1 className="garancia-title"> Garancia beváltás</h1>

        <div className="garancia-feltetelek">
          <h2 className="feltetelek-title">Garancia feltételei</h2>
          <ul className="feltetelek-list">
            <li>Vásárlástól számított 2 évig érvényes</li>
            <li>Csak gyártási hibára vonatkozik</li>
            <li>Számla bemutatása kötelező</li>
            <li>Javítás ingyenes</li>
          </ul>
        </div>

        {submitted && (
          <div className="success-message">
            ✅ Garancia igényedet rögzítettük!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="form-title">Garancia igény beadása</h2>
            
            <div className="form-group">
              <label>Neved *</label>
              <input 
                type="text" 
                name="nev" 
                value={formData.nev} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Termék neve *</label>
              <input 
                type="text" 
                name="termekNev" 
                value={formData.termekNev} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Vásárlás dátuma *</label>
              <input 
                type="date" 
                name="datum" 
                value={formData.datum} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Probléma leírása *</label>
              <textarea 
                name="problema" 
                rows="4" 
                value={formData.problema} 
                onChange={handleChange} 
                required
              ></textarea>
            </div>

            <button type="submit" className="submit-btn">
              Garancia igény beadása
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Garancia;