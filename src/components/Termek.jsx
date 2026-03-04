import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";

function Termekek() {
  const [termekek, setTermekek] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4000/termekek")
      .then(res => res.json())
      .then(data => setTermekek(data))
      .catch(err => console.error("Hiba a termékek lekérésekor:", err));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Termékek</h1>

      <div className="grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1 gap-6 justify-items-center">
        {termekek.map((t) => (
          <ProductCard key={t.id} product={t} />
        ))}
      </div>
    </div>
  );
}

export default Termekek;