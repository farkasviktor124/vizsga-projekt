import React from "react";

const ProductCard = ({ product }) => {
  return (
    <div className="flex justify-center my-5">
      <div className="w-80 rounded-xl border border-gray-300 bg-white shadow-md overflow-hidden">

        {/* Kép helye */}
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400">Nincs kép</span>
        </div>

        {/* Terméknév */}
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            {product.nev}
          </h2>
        </div>

        {/* Tartalom */}
        <div className="px-4 py-3 space-y-2 text-gray-700">

          {/* Ár */}
          <p className="text-xl font-bold text-green-600">
            {product.ar} Ft
          </p>

      

          {/* Adatok */}
          <p><strong>Állapot:</strong> {product.allapot || "Nincs megadva"}</p>
          <p><strong>Évjárat:</strong> {product.evjarat || "Nincs megadva"}</p>       {/*A  egy HTML‑elem, aminek az a feladata, hogy kiemelje a szöveget, vagyis félkövérre tegye, és fontosnak jelölje. */}
          <p><strong>Gyártó:</strong> {product.gyarto || "Nincs megadva"}</p>
          <p><strong>Árus:</strong> {product.arus || "Nincs megadva"}</p>
        </div>

        {/* Kosár gomb */}
        <div className="px-4 py-3 border-t bg-gray-50 flex justify-end">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            🛒 Kosárba
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductCard;