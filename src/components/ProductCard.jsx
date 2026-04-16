import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext.jsx";

const ProductCard = ({ product, onReject }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const defaultImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3Ctext x='10' y='55' fill='%2366f0ff' font-family='monospace' font-size='14'%3ENo img%3C/text%3E%3C/svg%3E";

  const handleCardClick = () => {
    const productSlug = product.nev
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    navigate(`/termek/${productSlug}`, { state: { product } });
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart({ ...product });
  };

  // EZ A FÜGGVÉNY VOLT HIÁNYZÓ!
  const handleReject = (e) => {
    e.stopPropagation();
    if (onReject) {
      onReject(product.id);
    }
  };

  return (
    <div className="product-card" style={{ fontSize: '120%', cursor: 'pointer' }} onClick={handleCardClick}>
      <div className="product-image">
        <img 
          src={product.kep || defaultImage} 
          alt={product.nev} 
          onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
        />
      </div>

      <h3 style={{ fontSize: '120%' }}>{product.nev || "Ismeretlen termék"}</h3>

      <div className="product-details" style={{ fontSize: '120%' }}>
        <p className="price" style={{ fontSize: '120%' }}>{product.ar || 0} Ft</p>
        <p><strong>Állapot:</strong> {product.allapot || "N/A"}</p>
        <p><strong>Évjárat:</strong> {product.evjarat || "N/A"}</p>
      </div>

      <button 
        className="cart-btn"
        style={{ fontSize: '120%' }}
        onClick={handleAddToCart}
      >
        Kosárba
      </button>

      <button 
        className="reject-btn" 
        onClick={handleReject}
        style={{ fontSize: '120%' }}
      >
        X Elutasítás
      </button>
    </div>
  );
};

export default ProductCard;