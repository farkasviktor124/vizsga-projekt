import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext.jsx";

const CartButton = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();

  // Összes mennyiség a kosárban
  const totalItems = cartItems?.reduce((sum, item) => sum + (item.quantity ?? 1), 0) ?? 0;

  return (
    <button className="cart-btn" onClick={() => navigate("/cart")}>
      Kosár ({totalItems})
    </button>
  );
};

export default CartButton;