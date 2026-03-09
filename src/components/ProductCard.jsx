
import React from "react";

const ProductCard = ({ product }) => {
  
  const defaultImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3Ctext x='10' y='55' fill='%2366f0ff' font-family='monospace' font-size='14'%3ENo img%3C/text%3E%3C/svg%3E";

  return (
    <div className="product-card">
      {/* Kép helye */}
      <div className="product-image">
        {product.kep ? (
          <img 
            src={product.kep} 
            alt={product.nev} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultImage;
            }}
          />
        ) : (
          <img src={defaultImage} alt="Nincs kép" />
        )}
      </div>

      {/* Terméknév */}
      <h3>{product.nev || "Ismeretlen termék"}</h3>

      {/* Tartalom */}
      <div className="product-details">
        <p className="price">{product.ar || 0} Ft</p>
        <p><strong>Állapot:</strong> {product.allapot || "N/A"}</p>
        <p><strong>Évjárat:</strong> {product.evjarat || "N/A"}</p>
        <p><strong>Gyártó:</strong> {product.gyarto || "N/A"}</p>
        <p><strong>Árus:</strong> {product.arus || "N/A"}</p>
      </div>

      {/* Kosár gomb */}
      <button 
        className="cart-btn"
        onClick={() => alert(`Kosárba téve: ${product.nev}`)}
      >
        🛒 Kosárba
      </button>
    </div>
  );
};

export default ProductCard;