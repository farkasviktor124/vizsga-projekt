// ProductGrid.jsx - Javított verzió
import React, { useState, useEffect } from "react";
import ProductCard from "./ProductCard";

const ProductGrid = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log("Termékek lekérése...");
      const response = await fetch("http://localhost:4000/termekek");
      
      if (!response.ok) {
        throw new Error(`HTTP hiba: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Kapott termékek:", data);
      setProducts(data);
    } catch (error) {
      console.error("Hiba a termékek betöltésekor:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="retro-title">BETÖLTÉS...</div>
        <div className="retro-loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "#ff6b6b", textAlign: "center", padding: "50px" }}>
        <h3>❌ Hiba történt</h3>
        <p>{error}</p>
        <button onClick={fetchProducts}>Újrapróbálkozás</button>
      </div>
    );
  }

  return (
    <div id="productGrid">
      {products.length === 0 ? (
        <p style={{ color: "#a0f0ff", textAlign: "center", padding: "50px" }}>
          ⚡ Nincsenek termékek az adatbázisban ⚡
        </p>
      ) : (
        products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))
      )}
    </div>
  );
};

export default ProductGrid;