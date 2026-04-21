// CartContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // Kosár betöltése localStorage-ból
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Hiba a kosár betöltésekor:", e);
      }
    }
  }, []);

  // Kosár mentése
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  //  Készlet módosítása a backendben (pozitív = csökkent, negatív = növel)
  const modositKeszlet = async (termekId, valtozas, termekNev) => {
    try {
      const elojel = valtozas > 0 ? `-${valtozas}` : `+${Math.abs(valtozas)}`;
      console.log(`[KÉSZLET MÓDOSÍTÁS] Termék: ${termekNev} (ID: ${termekId}), Változás: ${elojel} db`);
      
      const response = await fetch("http://localhost:4000/api/keszlet/csokkent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termekId, mennyiseg: valtozas })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`[KÉSZLET MÓDOSÍTÁS] Sikeres! Új készlet: ${data.ujKeszlet} db`);
        return true;
      } else {
        console.error(`[KÉSZLET MÓDOSÍTÁS] Hiba: ${data.message}`);
        return false;
      }
    } catch (error) {
      console.error("[KÉSZLET MÓDOSÍTÁS] Hálózati hiba:", error);
      return false;
    }
  };

  // Kosárba helyezés - KÉSZLET CSÖKKENTÉS
  const addToCart = async (product) => {
    console.log("[KOSÁRBA] Termék hozzáadása:", product.nev);
    
    // Ellenőrizzük, hogy van-e már a kosárban
    const existing = cartItems.find((p) => p.id === product.id);
    const jelenlegiMennyiseg = existing ? (existing.quantity || 1) : 0;
    const ujMennyiseg = jelenlegiMennyiseg + 1;
    
    //  Készlet CSÖKKENTÉSE a backendben (-1)
    const sikeres = await modositKeszlet(product.id, 1, product.nev);
    
    if (!sikeres) {
      alert(`❌ Nem sikerült a terméket kosárba helyezni! (Nincs elég készlet)`);
      return;
    }
    
    // Frissítjük a lokális state-et
    setCartItems((prev) => {
      const existingItem = prev.find((p) => p.id === product.id);
      if (existingItem) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: (p.quantity ?? 1) + 1 } : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    
    alert(`✅ ${product.nev} kosárba került!`);
  };

  //  Termék eltávolítása a kosárból - KÉSZLET VISSZAÁLLÍTÁS
  const removeFromCart = async (id) => {
    const item = cartItems.find(p => p.id === id);
    if (!item) return;
    
    const mennyiseg = item.quantity || 1;
    console.log(`[KOSÁRBÓL TÖRLÉS] ${item.nev}, Mennyiség: ${mennyiseg} db - Visszaállítás`);
    
    //  Készlet VISSZAÁLLÍTÁSA (+mennyiseg)
    const sikeres = await modositKeszlet(id, -mennyiseg, item.nev);
    
    if (!sikeres) {
      console.error("Hiba a készlet visszaállításakor!");
    }
    
    setCartItems((prev) => prev.filter((p) => p.id !== id));
  };

  //  Mennyiség módosítása - kezeli a növelést és csökkentést is
  const updateQuantity = async (id, newQuantity) => {
    const item = cartItems.find(p => p.id === id);
    if (!item) return;
    
    const currentQuantity = item.quantity || 1;
    const kulonbseg = newQuantity - currentQuantity;
    
    if (kulonbseg === 0) return;
    
    console.log(`[MENNYISÉG MÓDOSÍTÁS] ${item.nev}: ${currentQuantity} -> ${newQuantity} db (különbség: ${kulonbseg})`);
    
    if (kulonbseg > 0) {
      // Növelés - KÉSZLET CSÖKKENTÉS
      const sikeres = await modositKeszlet(id, kulonbseg, item.nev);
      if (!sikeres) {
        alert(`❌ Nem sikerült növelni a mennyiséget! (Nincs elég készlet)`);
        return;
      }
    } else {
      // Csökkentés - KÉSZLET VISSZAÁLLÍTÁS
      const sikeres = await modositKeszlet(id, kulonbseg, item.nev);
      if (!sikeres) {
        console.error("Hiba a készlet visszaállításakor!");
      }
    }
    
    setCartItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: newQuantity } : p))
    );
  };

  // Kosár ürítése - MINDEN TERMÉK VISSZAÁLLÍTÁSA
  const clearCart = async () => {
    console.log("[KOSÁR ÜRÍTÉS] Összes termék visszaállítása...");
    
    // Minden termék készletének visszaállítása
    for (const item of cartItems) {
      const mennyiseg = item.quantity || 1;
      await modositKeszlet(item.id, -mennyiseg, item.nev);
    }
    
    setCartItems([]);
    localStorage.removeItem("cart");
  };

  const cartTotal = cartItems.reduce((sum, item) => {
    const price = item.akcios_ar ?? item.ar ?? 0;
    return sum + price * (item.quantity ?? 1);
  }, 0);

  //  Rendelés leadása - VÉGLEGESÍTÉS (nem állítjuk vissza a készletet)
  const submitOrder = async (orderDetails = {}) => {
    setOrderLoading(true);
    setOrderError(null);

    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        throw new Error("Kérlek jelentkezz be a rendelés leadásához!");
      }

      if (cartItems.length === 0) {
        throw new Error("A kosár üres!");
      }

      console.log("[RENDELÉS] Rendelés véglegesítése - Készlet már le van vonva:", cartItems);
      
      // Itt jöhet a rendelés mentése az adatbázisba
      // A készletet NEM állítjuk vissza, mert a vásárlás megtörtént
      
      // Kosár ürítése (de itt már nem kell visszaállítani a készletet)
      setCartItems([]);
      localStorage.removeItem("cart");
      
      alert("✅ Rendelés sikeresen leadva!");
      
      return { success: true, message: "✅ Rendelés sikeresen leadva!" };

    } catch (error) {
      console.error("Rendelés hiba:", error);
      setOrderError(error.message);
      alert(`❌ Hiba: ${error.message}`);
      return { success: false, message: error.message };
    } finally {
      setOrderLoading(false);
    }
  };

  // Készlet ellenőrzése
  const checkStock = async (termekId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/keszlet/${termekId}`);
      const data = await response.json();
      if (data.success) {
        return { success: true, keszlet: data.keszlet, nev: data.nev };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Készlet ellenőrzés hiba:', error);
      return { success: false, message: error.message };
    }
  };

  return (
    <CartContext.Provider
      value={{ 
        cartItems, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart, 
        cartTotal,
        submitOrder,
        checkStock,
        orderLoading,
        orderError
      }}
    >
      {children}
    </CartContext.Provider>
  );
};