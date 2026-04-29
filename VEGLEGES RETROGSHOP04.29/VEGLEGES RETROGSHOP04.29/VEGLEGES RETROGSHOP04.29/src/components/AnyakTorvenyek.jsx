
import React from "react";

const AnyakTorvenyek = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-base-200 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6">⚖️ Általános Szerződési Feltételek</h1>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-primary mb-2">1. Általános rendelkezések</h2>
            <p>Jelen ÁSZF szabályozza a RetroShop webáruház és a Vásárló közötti jogviszonyt.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary mb-2">2. Szolgáltató adatai</h2>
            <p>Cégnév: RetroShop Kft.</p>
            <p>Székhely: 1052 Budapest, Váci utca 1.</p>
            <p>Email: info@retroshop.hu</p>
            <p>Telefon: +36 1 234 5678</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary mb-2">3. Megrendelés folyamata</h2>
            <p>A megrendelés leadásához regisztráció szükséges. A megrendelés után visszaigazoló emailt küldünk.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary mb-2">4. Árak és fizetés</h2>
            <p>Az árak bruttó árak, tartalmazzák az ÁFA-t. Fizetési módok: bankkártya, átutalás, utánvétel.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary mb-2">5. Szállítás</h2>
            <p>Szállítási határidő: 2-5 munkanap. 50.000 Ft felett ingyenes.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary mb-2">6. Elállási jog</h2>
            <p>A vásárlót 14 napos indoklás nélküli elállási jog illeti meg.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary mb-2">7. Garancia</h2>
            <p>A termékekre 2 év gyártói garancia vonatkozik.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary mb-2">8. Adatvédelem</h2>
            <p>Személyes adataidat a hatályos törvényeknek megfelelően kezeljük.</p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-600 text-center text-sm text-gray-400">
          <p>Utolsó módosítás: 2026. április 19.</p>
          <p>© 2026 RetroShop - Minden jog fenntartva.</p>
        </div>
      </div>
    </div>
  );
};

export default AnyakTorvenyek;