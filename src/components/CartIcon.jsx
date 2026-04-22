import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';

const CartIcon = () => {
  const navigate = useNavigate();
  const { cartCount } = useCart();

  return (
    <div 
      style={{
        position: 'relative',
        cursor: 'pointer',
        marginLeft: '15px'
      }}
      onClick={() => navigate('/kosar')}
    >
      <span style={{ fontSize: '24px' }}>🛒</span>
      {cartCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: '#66f0ff',
          color: '#0f1b24',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {cartCount}
        </span>
      )}
    </div>
  );
};

export default CartIcon;