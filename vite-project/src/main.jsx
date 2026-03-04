import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'  // Itt NE legyen BrowserRouter!
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />  {/* A BrowserRouter az App.jsx-ben van! */}
  </React.StrictMode>,
)