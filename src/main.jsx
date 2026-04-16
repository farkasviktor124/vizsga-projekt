import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { CartProvider } from './components/CartContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CartProvider>
      <App />  {/* BrowserRouter maradhat az App.jsx-ben */}
    </CartProvider>
  </React.StrictMode>,
)