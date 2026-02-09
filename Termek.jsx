import React from 'react'

const Termek = () => {
  return (
    <div>
      <main id="productGrid">
  <div class="product" onclick="openProduct(1)">
  { /* <img src="images/1416637426.msi-cyborg-15-a13vf-1816-9s7-15k111-1816.jpg">*/}
    <h3>MSI Cyborg 15 Gaming Laptop</h3>
    <p>499 990 Ft</p>
  </div>

  <div class="product" onclick="openProduct(2)">
 {/*   <img src="images/res_c7cea2fd64f0ba2390b54ee1a4a0a5ec.png">*/}
    <h3>RTX 4070 Ti Super Videókártya</h3>
    <p>249 990 Ft</p>
  </div>

  <div class="product" onclick="openProduct(3)">
 {  /* <img src="images/ProductImage_GATA-2679_01_06a58eb77a80f6c01476dedb8a28ebb3.jpg">*/}
    <h3>Corsair Mechanikus billentyűzet</h3>
    <p>39 990 Ft</p>
  </div>
</main>
    </div>
  )
}

export default Termek
