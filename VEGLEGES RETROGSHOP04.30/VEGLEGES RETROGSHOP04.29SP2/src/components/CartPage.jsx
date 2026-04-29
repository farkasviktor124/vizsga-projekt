
import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext.jsx";

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();

  const defaultImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3Ctext x='10' y='55' fill='%2366f0ff' font-family='monospace' font-size='14'%3ENo img%3C/text%3E%3C/svg%3E";

  const getImageUrl = (kepPath) => {
    if (!kepPath) return defaultImage;
    if (kepPath.startsWith('http')) return kepPath;
    if (kepPath.startsWith('/uploads/')) {
      return `http://localhost:4000${kepPath}`;
    }
    return `http://localhost:4000/uploads/${kepPath}`;
  };

  const safeCartTotal = cartItems?.reduce((sum, item) => {
    const price = item.akcios_ar ?? item.ar; 
    if (price == null) return sum; 
    const quantity = item.quantity ?? 1; 
    return sum + price * quantity;
  }, 0) || 0;

  const szallitasKoltseg = safeCartTotal > 50000 ? 0 : 3990;
  const vegosszeg = safeCartTotal + szallitasKoltseg;

  const handleTovabbFizetes = () => {
    // Ellenőrizzük, hogy van-e termék a kosárban
    if (!cartItems || cartItems.length === 0) {
      return;
    }
    // Navigálás a rendelési oldalra
    navigate("/rendeles");
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", textAlign: "center" }}>
        <h1 style={{ color: "#a0f0ff", marginBottom: "30px" }}>Kosár</h1>
        <p>A kosár üres</p>
        <button
          onClick={() => navigate("/termekek")}
          style={{
            background: "#66f0ff",
            color: "#0f1b24",
            border: "none",
            padding: "12px 24px",
            fontSize: "14px",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          Vásárlás folytatása
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ color: "#a0f0ff", marginBottom: "30px" }}>Kosár</h1>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
        
        <div>
          {cartItems.map((item) => {
            const price = item.akcios_ar ?? item.ar ?? null;
            const quantity = item.quantity ?? 1;
            const keszlet = item.keszlet ?? 0;

            return (
              <div
                key={item.id ?? Math.random()}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 1fr auto",
                  gap: "20px",
                  background: "#1a2b3a",
                  border: "1px solid #66f0ff",
                  padding: "15px",
                  marginBottom: "15px",
                }}
              >
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    background: "#0f1b24",
                    border: "1px solid #66f0ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={getImageUrl(item.kep)}
                    alt={item.nev ?? "Termék"}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultImage;
                    }}
                  />
                </div>

                <div>
                  <h3 style={{ color: "#a0f0ff", fontSize: "14px", margin: "0 0 10px 0" }}>
                    {item.nev ?? "Ismeretlen termék"}
                  </h3>
                  {price != null && (
                    <p style={{ color: "#66f0ff", fontSize: "16px", fontWeight: "bold" }}>
                      {price.toLocaleString()} Ft
                    </p>
                  )}
                  <p style={{ color: "#888", fontSize: "12px", marginTop: "5px" }}>
                    📦 Készlet: {keszlet} db
                  </p>
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      onClick={() => {
                        if (quantity > 1) {
                          updateQuantity(item.id, quantity - 1);
                        }
                      }}
                      style={{
                        background: "transparent",
                        color: quantity <= 1 ? "#666" : "#a0f0ff",
                        border: `1px solid ${quantity <= 1 ? "#444" : "#66f0ff"}`,
                        width: "30px",
                        height: "30px",
                        cursor: quantity <= 1 ? "not-allowed" : "pointer",
                        opacity: quantity <= 1 ? 0.5 : 1,
                      }}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span style={{ color: "#a0f0ff", minWidth: "30px", textAlign: "center" }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => {
                        if (quantity + 1 <= keszlet) {
                          updateQuantity(item.id, quantity + 1);
                        } else {
                          alert(`Sajnos csak ${keszlet} db van készleten!`);
                        }
                      }}
                      style={{
                        background: "transparent",
                        color: quantity >= keszlet ? "#666" : "#a0f0ff",
                        border: `1px solid ${quantity >= keszlet ? "#444" : "#66f0ff"}`,
                        width: "30px",
                        height: "30px",
                        cursor: quantity >= keszlet ? "not-allowed" : "pointer",
                        opacity: quantity >= keszlet ? 0.5 : 1,
                      }}
                      disabled={quantity >= keszlet}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{
                      background: "transparent",
                      color: "#ff6b6b",
                      border: "1px solid #ff6b6b",
                      padding: "5px 10px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Törlés
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={clearCart}
            style={{
              background: "transparent",
              color: "#ff6b6b",
              border: "1px solid #ff6b6b",
              padding: "10px 20px",
              fontSize: "14px",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            Kosár ürítése
          </button>
        </div>

        <div
          style={{
            background: "#1a2b3a",
            border: "1px solid #66f0ff",
            padding: "20px",
            height: "fit-content",
          }}
        >
          <h2 style={{ color: "#a0f0ff", fontSize: "18px", marginBottom: "20px" }}>Összegzés</h2>

          <div style={{ marginBottom: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ color: "#a0f0ff" }}>Részösszeg:</span>
              <span style={{ color: "#66f0ff", fontWeight: "bold" }}>
                {safeCartTotal.toLocaleString()} Ft
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ color: "#a0f0ff" }}>Szállítás:</span>
              <span style={{ color: "#66f0ff" }}>
                {szallitasKoltseg === 0 ? "Ingyenes" : `${szallitasKoltseg.toLocaleString()} Ft`}
              </span>
            </div>

            {szallitasKoltseg > 0 && (
              <p style={{ color: "#4ecdc4", fontSize: "12px", marginTop: "5px" }}>
                {50000 - safeCartTotal} Ft hiányzik az ingyenes szállításhoz
              </p>
            )}
          </div>

          <div
            style={{
              borderTop: "1px solid #66f0ff",
              paddingTop: "15px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#a0f0ff", fontSize: "16px" }}>Végösszeg:</span>
              <span style={{ color: "#66f0ff", fontSize: "24px", fontWeight: "bold" }}>
                {vegosszeg.toLocaleString()} Ft
              </span>
            </div>
          </div>

          <button
            onClick={handleTovabbFizetes}
            style={{
              width: "100%",
              background: "#66f0ff",
              color: "#0f1b24",
              border: "none",
              padding: "15px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "10px",
            }}
          >
            Tovább a fizetéshez
          </button>

          <button
            onClick={() => navigate("/termekek")}
            style={{
              width: "100%",
              background: "transparent",
              color: "#a0f0ff",
              border: "1px solid #66f0ff",
              padding: "15px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Vásárlás folytatása
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;