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

  // Készlet módosítása a backendben (pozitív = csökkent, negatív = növel)
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
    
    const stockCheck = await checkStock(product.id);
    if (!stockCheck.success) {
      alert(`❌ Nem sikerült ellenőrizni a készletet!`);
      return;
    }
    
    if (stockCheck.keszlet <= 0) {
      alert(`❌ Sajnáljuk, a(z) ${product.nev} jelenleg nincs készleten!`);
      return;
    }
    
    const existing = cartItems.find((p) => p.id === product.id);
    const jelenlegiMennyiseg = existing ? (existing.quantity || 1) : 0;
    
    if (stockCheck.keszlet < jelenlegiMennyiseg + 1) {
      alert(`❌ Sajnáljuk, csak ${stockCheck.keszlet} db van készleten a(z) ${product.nev} termékből!`);
      return;
    }
    
    // Készlet CSÖKKENTÉSE a backendben (-1)
    const sikeres = await modositKeszlet(product.id, 1, product.nev);
    
    if (!sikeres) {
      alert(`❌ Nem sikerült a terméket kosárba helyezni!`);
      return;
    }
    
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

  // Termék eltávolítása a kosárból - KÉSZLET VISSZAÁLLÍTÁS
  const removeFromCart = async (id) => {
    const item = cartItems.find(p => p.id === id);
    if (!item) return;
    
    const mennyiseg = item.quantity || 1;
    console.log(`[KOSÁRBÓL TÖRLÉS] ${item.nev}, Mennyiség: ${mennyiseg} db - Visszaállítás`);
    
    const sikeres = await modositKeszlet(id, -mennyiseg, item.nev);
    
    if (!sikeres) {
      console.error("Hiba a készlet visszaállításakor!");
    }
    
    setCartItems((prev) => prev.filter((p) => p.id !== id));
  };

  // Mennyiség módosítása
  const updateQuantity = async (id, newQuantity) => {
    const item = cartItems.find(p => p.id === id);
    if (!item) return;
    
    const currentQuantity = item.quantity || 1;
    const kulonbseg = newQuantity - currentQuantity;
    
    if (kulonbseg === 0) return;
    
    console.log(`[MENNYISÉG MÓDOSÍTÁS] ${item.nev}: ${currentQuantity} -> ${newQuantity} db`);
    
    if (kulonbseg > 0) {
      const stockCheck = await checkStock(id);
      if (!stockCheck.success) {
        alert(`❌ Nem sikerült ellenőrizni a készletet!`);
        return;
      }
      
      if (stockCheck.keszlet < kulonbseg) {
        alert(`❌ Sajnáljuk, csak ${stockCheck.keszlet} db van készleten!`);
        return;
      }
      
      const sikeres = await modositKeszlet(id, kulonbseg, item.nev);
      if (!sikeres) {
        alert(`❌ Nem sikerült növelni a mennyiséget!`);
        return;
      }
    } else {
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

// Rendelés leadása - NEM vonunk le újra, mert már a kosárban levonásra került
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

    console.log("[RENDELÉS] Rendelés véglegesítése:", cartItems);
    
    // A rendelés adatok előkészítése a backend számára
    const orderData = {
      ...orderDetails,
      termekek: cartItems.map(item => ({
        id: item.id,
        nev: item.nev,
        ar: item.akcios_ar ?? item.ar,
        mennyiseg: item.quantity || 1
      })),
      reszosszeg: cartTotal,
      szallitasKoltseg: orderDetails.szallitasKoltseg || 0,
      vegosszeg: orderDetails.fizetendoOsszeg || cartTotal,
      user_id: userStr ? JSON.parse(userStr).id : null,
      szallitasMod: orderDetails.szallitasMod || "hazhoz",
      szallitasPont: orderDetails.szallitasPont || null,
      szallitasPontNev: orderDetails.szallitasPontNev || null,
      szallitasPontCim: orderDetails.szallitasPontCim || null,
      szamlazasiCimId: orderDetails.szamlazasiCimId || null,
      szallitasiCimId: orderDetails.szallitasiCimId || null
    };
    
    // Rendelés mentése a backendbe - HASZNÁLD A /api/rendeles végpontot
    const response = await fetch("http://localhost:4000/api/rendeles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || "Rendelés mentési hiba!");
    }
    
    console.log("[RENDELÉS] Rendelés sikeresen mentve:", result);
    
    // Kosár ürítése
    setCartItems([]);
    localStorage.removeItem("cart");
    
    alert("✅ Rendelés sikeresen leadva!");
    
    return { success: true, message: "✅ Rendelés sikeresen leadva!", orderId: result.id };

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