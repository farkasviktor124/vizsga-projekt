// src/components/BarionPayment.jsx (javított processPayment függvénnyel)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./BarionPayment.css";

const API_BASE_URL = 'http://localhost:4000';

const BarionPayment = ({ orderDetails, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const [paymentStep, setPaymentStep] = useState(1);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const osszeg = orderDetails?.osszeg || 0;
  const rendelesSzam = orderDetails?.rendelesSzam || "REND-" + Date.now();
  const rendelesId = orderDetails?.rendelesId;

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiry(e.target.value);
    if (formatted.length <= 5) setCardExpiry(formatted);
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 3) setCardCvv(value);
  };

  const validateForm = () => {
    setError("");
    
    if (!cardName.trim()) {
      setError("Kérlek add meg a kártyán szereplő nevet!");
      return false;
    }
    
    const cardNumberClean = cardNumber.replace(/\s/g, '');
    if (cardNumberClean.length !== 16) {
      setError("Érvénytelen kártyaszám! (16 számjegy)");
      return false;
    }
    
    if (!cardExpiry || cardExpiry.length !== 5) {
      setError("Érvénytelen lejárati dátum! (MM/YY)");
      return false;
    }
    
    const [month, year] = cardExpiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (parseInt(month) < 1 || parseInt(month) > 12) {
      setError("Érvénytelen hónap!");
      return false;
    }
    
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      setError("A kártya lejárt!");
      return false;
    }
    
    if (!cardCvv || cardCvv.length !== 3) {
      setError("Érvénytelen CVV kód! (3 számjegy)");
      return false;
    }
    
    return true;
  };

  // JAVÍTOTT: Valódi backend hívás a fizetés rögzítéséhez
  const processPayment = async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    setError("");
    
    try {
      const paymentId = `BARION-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      // Fizetés rögzítése a backendben
      const response = await fetch(`${API_BASE_URL}/api/barion/payment-success`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rendelesId: rendelesId,
          rendelesSzam: rendelesSzam,
          paymentId: paymentId,
          osszeg: osszeg,
          cardLast4: cardNumber.slice(-4),
          cardName: cardName,
          fizetesMod: "bankkartya"
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentSuccess(true);
        setPaymentStep(3);
        
        if (onSuccess) {
          onSuccess({ 
            success: true, 
            paymentId: paymentId,
            rendelesId: rendelesId
          });
        }
      } else {
        setError(data.error || "A fizetés rögzítése sikertelen!");
        setPaymentStep(1);
      }
    } catch (error) {
      console.error("Fizetés feldolgozási hiba:", error);
      setError("Hálózati hiba történt! Kérlek próbáld újra.");
      setPaymentStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const startPayment = () => {
    if (validateForm()) {
      setPaymentStep(2);
      processPayment();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="barion-payment-container">
      <div className="barion-payment-card">
        <div className="barion-header">
          <div className="barion-logo">
            <span className="logo-icon">🛒</span>
            <span className="logo-text">RETROGSHOP</span>
            <span className="barion-badge">Barion Secure</span>
          </div>
          <div className="payment-status">
            {paymentStep === 1 && <span>🔒 Adatok megadása</span>}
            {paymentStep === 2 && <span>💳 Fizetés feldolgozása...</span>}
            {paymentStep === 3 && <span>✅ Fizetés sikeres</span>}
          </div>
        </div>

        {paymentStep === 1 && (
          <div className="barion-body">
            <div className="payment-amount">
              <h3>Fizetendő összeg</h3>
              <div className="amount">{osszeg.toLocaleString()} Ft</div>
              <div className="order-number">Rendelés szám: {rendelesSzam}</div>
            </div>

            <div className="card-form">
              <h3>💰 Bankkártya adatok</h3>
              
              <div className="form-group">
                <label>Kártyán szereplő név</label>
                <input
                  type="text"
                  placeholder="Pl: KOVACS PÉTER"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className="card-input"
                />
              </div>

              <div className="form-group">
                <label>Kártyaszám</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className="card-input"
                  maxLength="19"
                />
                <div className="card-icons">
                  <span>💳 Visa</span>
                  <span>💳 MasterCard</span>
                  <span>💳 Maestro</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Lejárat (MM/YY)</label>
                  <input
                    type="text"
                    placeholder="12/25"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    className="card-input"
                    maxLength="5"
                  />
                </div>
                <div className="form-group half">
                  <label>CVV/CVC</label>
                  <input
                    type="password"
                    placeholder="123"
                    value={cardCvv}
                    onChange={handleCvvChange}
                    className="card-input"
                    maxLength="3"
                  />
                  <div className="cvv-hint">🔒 A kártya hátulján található 3 számjegy</div>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="secure-badge">
                <span>🔒 SSL Secure</span>
                <span>✓ PCI DSS Compliant</span>
                <span>✓ 3D Secure</span>
              </div>
            </div>

            <div className="barion-actions">
              <button className="cancel-btn" onClick={handleCancel}>
                Mégse
              </button>
              <button className="pay-btn" onClick={startPayment} disabled={isProcessing}>
                {isProcessing ? "Feldolgozás..." : `Fizetés ${osszeg.toLocaleString()} Ft`}
              </button>
            </div>
          </div>
        )}

        {paymentStep === 2 && (
          <div className="barion-body processing">
            <div className="processing-animation">
              <div className="spinner"></div>
              <div className="processing-text">
                <h3>Fizetés feldolgozása...</h3>
                <p>Kérjük, várjon amíg a tranzakciót feldolgozzuk</p>
                <p className="small">Ne frissítse az oldalt!</p>
              </div>
            </div>
          </div>
        )}

        {paymentStep === 3 && (
          <div className="barion-body success">
            <div className="success-animation">
              <div className="checkmark">✓</div>
              <h3>Fizetés sikeres!</h3>
              <p>A tranzakció sikeresen megtörtént.</p>
              <p>A visszaigazolást e-mailben elküldtük.</p>
              <div className="order-summary">
                <p><strong>Rendelés szám:</strong> {rendelesSzam}</p>
                <p><strong>Összeg:</strong> {osszeg.toLocaleString()} Ft</p>
                <p><strong>Dátum:</strong> {new Date().toLocaleString()}</p>
                <p><strong>Fizetési azonosító:</strong> BARION-{Date.now()}</p>
              </div>
            </div>
            <div className="barion-actions">
              <button className="success-btn" onClick={() => navigate("/")}>
                Vissza a főoldalra
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarionPayment;