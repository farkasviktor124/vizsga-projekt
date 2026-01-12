const products = {
    1: { name: "Gaming Laptop", price: "499 990 Ft", img: "https://via.placeholder.com/400x300" },
    2: { name: "RTX Videókártya", price: "329 990 Ft", img: "https://via.placeholder.com/400x300" },
    3: { name: "Mechanikus billentyűzet", price: "39 990 Ft", img: "https://via.placeholder.com/400x300" }
  };
  
  let cart = 0;
  let currentProduct = null;
  
  function openProduct(id) {
    currentProduct = products[id];
    document.getElementById("productGrid").style.display = "none";
    document.getElementById("productPage").classList.remove("hidden");
  
    detailName.textContent = currentProduct.name;
    detailPrice.textContent = currentProduct.price;
    detailImg.src = currentProduct.img;
  }
  
  function goBack() {
    document.getElementById("productGrid").style.display = "grid";
    document.getElementById("productPage").classList.add("hidden");
  }
  
  function addToCart() {
    cart++;
    document.getElementById("cartCount").textContent = cart;
    alert("Termék a kosárba került!");
  }
  