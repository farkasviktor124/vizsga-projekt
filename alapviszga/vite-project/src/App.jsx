import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {


  return (
    <>

    
  <main id="productGrid">

        <div className="product" onClick={() => openProduct(1)}>
           <img src="images/1416637426.msi-cyborg-15-a13vf-1816-9s7-15k111-1816.jpg" /> 
          <h3>MSI Cyborg 15 Gaming Laptop</h3>
          <p>499 990 Ft</p>
        </div>

        <div className="product" onClick={() => openProduct(2)}>
          <img src="images/res_c7cea2fd64f0ba2390b54ee1a4a0a5ec.png" />
          <h3>RTX 4070 Ti Super Videókártya</h3>
          <p>249 990 Ft</p>
        </div>

        <div className="product" onClick={() => openProduct(3)}>
          <img src="images/ProductImage_GATA-2679_01_06a58eb77a80f6c01476dedb8a28ebb3.jpg" />
          <h3>Corsair Mechanikus billentyűzet</h3>
          <p>39 990 Ft</p>
        </div>

      </main>

      {/* TERMÉK OLDAL */}
      <section id="productPage" className="hidden">

        <button className="back" onClick={() => goBack()}>
          ⬅ Vissza
        </button>

        <div className="product-detail">
          <img id="detailImg" />

          <div>
            <h2 id="detailName"></h2>
            <p id="detailPrice"></p>
            <p>Erőteljes, modern hardver játékhoz és munkához.</p>

            <button onClick={() => addToCart()}>
              🛒 Kosárba
            </button>

            <button className="pay">
              💳 Fizetés
            </button>
          </div>
        </div>

      </section>


    

    </>
  )
}

export default App
