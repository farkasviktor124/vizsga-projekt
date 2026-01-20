fetch("api/getProducts.php")
  .then(res => res.json())
  .then(products => {
    const grid = document.getElementById("productGrid");
    products.forEach(p => {
      grid.innerHTML += `
        <div class="product" onclick="openProduct(${p.id})">
          <img src="${p.image}">
          <h3>${p.name}</h3>
          <p>${p.price} Ft</p>
        </div>
      `;
    });
  });

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
  
  // modal elemek
const authBtn = document.getElementById("authBtn");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showRegister = document.getElementById("showRegister");
const authTitle = document.getElementById("authTitle");

// user menu
const userMenu = document.getElementById("userMenu");
const usernameDisplay = document.getElementById("usernameDisplay");
const logoutBtn = document.getElementById("logoutBtn");

// megnyit modal
authBtn.addEventListener("click", () => {
  authModal.classList.remove("hidden");
});

// bezár modal
closeAuth.addEventListener("click", () => {
  authModal.classList.add("hidden");
});

// login → register váltás
showRegister.addEventListener("click", e => {
  e.preventDefault();
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
  authTitle.textContent = "Regisztráció";
});

// login submit (AJAX)
loginForm.addEventListener("submit", e => {
  e.preventDefault();
  const data = new FormData(loginForm);

  fetch("api/login_ajax.php", {
    method: "POST",
    body: data
  })
  .then(res => res.json())
  .then(res => {
    if (res.success) {
      authModal.classList.add("hidden");
      setUserMenu(res.user);
    } else {
      alert(res.message);
    }
  });
});

// kijelentkezés
logoutBtn.addEventListener("click", () => {
  fetch("api/logout.php")
    .then(() => {
      userMenu.classList.add("hidden");
      authBtn.classList.remove("hidden");
    });
});

// bejelentkezett felhasználó megjelenítése
function setUserMenu(user) {
  authBtn.classList.add("hidden");
  userMenu.classList.remove("hidden");
  usernameDisplay.textContent = user.username;
}

// ellenőrzés oldalletöltéskor
fetch("api/check_session.php")
  .then(res => res.json())
  .then(res => {
    if (res.loggedIn) setUserMenu(res.user);
  });
