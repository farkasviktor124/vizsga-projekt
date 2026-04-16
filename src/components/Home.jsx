import React from "react";
import ProductCard from "./ProductCard";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <h1>
        Üdvözöljük a RetroGShop oldalán!
      </h1>
      <Link to="/termekek" className="vasarlas-gomb">
  Megkezdem a vásárlást
</Link>
   
    </div>
  );
}
