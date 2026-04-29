
import React from "react";

const Kapcsolat = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-base-200 rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6">📞 Kapcsolat</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-base-300 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Elérhetőségeink</h2>
            <p>📍 Cím: 1052 Budapest, Váci utca 1.</p>
            <p>📞 Telefon: +36 1 234 5678</p>
            <p>✉️ Email: info@retroshop.hu</p>
          </div>
          
          <div className="bg-base-300 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Ügyfélszolgálat</h2>
            <p>📞 +36 30 123 4567</p>
            <p>✉️ ugyfelszolgalat@retroshop.hu</p>
            <p>🕒 H-P: 9:00 - 17:00</p>
          </div>
          
          <div className="bg-base-300 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Nyitvatartás</h2>
            <p>Hétfő - Péntek: 10:00 - 18:00</p>
            <p>Szombat: 10:00 - 14:00</p>
            <p>Vasárnap: Zárva</p>
          </div>
          
          <div className="bg-base-300 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Közösségi média</h2>
            <p>📘 Facebook: facebook.com/retroshop</p>
            <p>📸 Instagram: @retroshop_hungary</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kapcsolat;