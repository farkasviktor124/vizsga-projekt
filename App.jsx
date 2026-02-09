import "./index.css";


export default function RetroGshop() {
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1>RetroGshop</h1>
          <p className="subtitle">A retro és modern technológia találkozása!</p>
          <button className="auth-btn">Bejelentkezés / Regisztráció</button>
        </div>

        <div className="header-right">
          <button className="cart-btn">Kosár (0)</button>
        </div>
      </header>

      {/* Products */}
      <main className="products">
        <ProductCard
          image="/images/msi-laptop.png"
          title="MSI Cyborg 15 Gaming Laptop"
          price="499 990 Ft"
        />

        <ProductCard
          image="/images/rtx-4070-ti.png"
          title="RTX 4070 Ti Super Videókártya"
          price="249 990 Ft"
        />

        <ProductCard
          image="/images/corsair-keyboard.png"
          title="Corsair Mechanikus billentyűzet"
          price="39 990 Ft"
        />
      </main>
    </div>
  );
}

function ProductCard({ image, title, price }) {
  return (
    <div className="product-card">
      <div className="image-wrapper">
        <img src={image} alt={title} />
      </div>

      <div className="product-info">
        <h3>{title}</h3>
        <p className="price">{price}</p>
      </div>
    </div>
  );
}
