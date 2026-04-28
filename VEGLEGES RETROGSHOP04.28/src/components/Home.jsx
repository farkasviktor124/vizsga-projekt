import React from "react";
import ProductCard from "./ProductCard";
import { Link } from "react-router-dom";

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* Tartalom */}
      <div style={{ flex: 1 }}>
        <h1>Üdvözöljük a RetroGShop oldalán!</h1>

        <Link to="/termekek" className="vasarlas-gomb">
          Megkezdem a vásárlást
        </Link>

        <div style={{
          display: "block",
          margin: "32px auto 0 auto",
          width: "320px",
          background: "#1a1a2e",
          padding: "24px",
          textAlign: "center"
        }}>
          <img
            src="/kep/stickman.png"
            alt="Vásárlás"
            style={{
              width: "280px"
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "20px",
        borderTop: "1px solid #333",
        color: "#666",
        fontSize: "14px",
        marginTop: "40px"
      }}>
        <p style={{ margin: 0 }}>
          © {year} RetroGShop – Minden jog fenntartva.
        </p>
        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#444" }}>
          A weboldalon található tartalmak szerzői jogi védelem alatt állnak.
        </p>
      </footer>

    </div>
  );
}
