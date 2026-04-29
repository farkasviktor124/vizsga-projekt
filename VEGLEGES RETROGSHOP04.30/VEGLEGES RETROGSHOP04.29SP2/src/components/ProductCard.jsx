import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext.jsx";

const ProductCard = ({ product, onReject, isAdmin, onDelete }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const defaultImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3Ctext x='10' y='55' fill='%2366f0ff' font-family='monospace' font-size='14'%3ENo img%3C/text%3E%3C/svg%3E";

  // Készlet ellenőrzése
  const keszlet = product.keszlet || 0;
  const nincsKeszleten = keszlet === 0;

 
  const getImageUrl = (kep) => {
    if (!kep) return defaultImage;
    if (kep.startsWith("http")) return kep;
    return `http://localhost:4000${kep}`;
  };

  const handleCardClick = () => {
    const productSlug = product.nev
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    navigate(`/termek/${productSlug}`, { state: { product } });
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!nincsKeszleten) {
      addToCart({ ...product });
    }
  };

  const handleReject = (e) => {
    e.stopPropagation();
    if (onReject) {
      onReject(product.id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(product.id);
    }
  };

  return (
    <div className="product-card" style={{ fontSize: '120%', cursor: 'pointer' }} onClick={handleCardClick}>
      <div className="product-image">
        <img
          src={getImageUrl(product.kep)}
          alt={product.nev}
          onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
        />
      </div>

      <h3 style={{ fontSize: '100%' }}>{product.nev || "Ismeretlen termék"}</h3>

      <div className="product-details" style={{ fontSize: '120%' }}>
        <p className="price" style={{ fontSize: '120%' }}>{product.ar || 0} Ft</p>
        <p><strong>Állapot:</strong> {product.allapot || "N/A"}</p>
        <p><strong>Évjárat:</strong> {product.evjarat || "N/A"}</p>
        
        {/* Készlet megjelenítés */}
        <div className="stock-info" style={{ marginTop: '8px' }}>
          
          <span style={{ 
            color: keszlet === 0 ? '#ef4444' : '#10b981',
            fontWeight: 'bold'
          }}>
            {keszlet === 0 ? "Nincs raktáron" : `${keszlet} db`}
          </span>
        </div>
      </div>

      {/* Kosárba és Elutasítás – csak NEM adminoknak */}
      {!isAdmin && (
        <div className="product-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            className="cart-btn"
            style={{ 
              fontSize: '10s0%',
              opacity: nincsKeszleten ? 0.5 : 1,
              cursor: nincsKeszleten ? "not-allowed" : "pointer"
            }}
            onClick={handleAddToCart}
            disabled={nincsKeszleten}
          >
            Kosárba
          </button>
          
        </div>
      )}

      {/* Törlés – csak adminoknak */}
      {isAdmin && (
        <button
          onClick={handleDelete}
          style={{
            fontSize: '110%',
            marginTop: '8px',
            width: '100%',
            padding: '8px',
            background: '#7f1d1d',
            color: '#fca5a5',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🗑️ Termék törlése
        </button>
      )}
    </div>
  );
};

export default ProductCard;