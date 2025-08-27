// ===== Endenture Storefront — Shared JS =====

// Simple product catalog (id -> product)
window.PRODUCTS = {
  jacket: {
    id: "jacket",
    name: "Waterproof Jacket",
    price: 499.00,
    images: ["images/product-1.jpg","images/product-1-alt1.jpg","images/product-1-alt2.jpg","images/product-1-alt3.jpg"],
    rating: 4.0,
    description: "Built for storms, designed for speed. 3‑layer breathable membrane keeps you dry while the articulated fit moves with you."
  },
  backpack: {
    id: "backpack",
    name: "Light-Weight Backpack",
    price: 249.00,
    images: ["images/product-2.jpg"],
    rating: 4.5,
    description: "Featherweight pack with supportive frame and thoughtful pocketing for big miles."
  },
  hikingstick: {
    id: "hikingstick",
    name: "Black Diamond Hiking Stick",
    price: 199.00,
    images: ["images/product-3.jpg"],
    rating: 4.5,
    description: "Durable, adjustable trekking pole for stability on varied terrain."
  },
  waterbottle: {
    id: "waterbottle",
    name: "Water Bottle",
    price: 39.00,
    images: ["images/product-4.jpg"],
    rating: 4.0,
    description: "Insulated, leak‑proof bottle to keep drinks cold or hot for hours."
  },
  boots: {
    id: "boots",
    name: "Waterproof Hiking Boots",
    price: 149.00,
    images: ["images/product-5.jpg"],
    rating: 4.5,
    description: "All‑terrain waterproof boots with grippy outsole."
  },
  gloves: {
    id: "gloves",
    name: "Fleece Glove with Hardloop",
    price: 65.00,
    images: ["images/product-6.jpg"],
    rating: 4.5,
    description: "Warm, breathable fleece gloves with loop for quick clipping."
  }
};

// --- Helpers ---
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

// Menu toggle (mobile)
(function(){
  const menu = document.getElementById("MenuItems");
  if (!menu) return;
  const mq = window.matchMedia("(max-width:700px)");
  function applyState(){
    if (mq.matches){
      // collapse by default on mobile
      if (!menu.style.maxHeight) menu.style.maxHeight = "0px";
    } else {
      // always visible on desktop
      menu.style.maxHeight = "none";
    }
  }
  applyState();
  mq.addEventListener ? mq.addEventListener("change", applyState) : window.addEventListener("resize", applyState);

  window.menutoggle = function(){
    if (!mq.matches) return; // no toggle on desktop
    menu.style.maxHeight = (menu.style.maxHeight === "0px" || !menu.style.maxHeight) ? "260px" : "0px";
  };
})();

// Cart storage
const CART_KEY = "endenture.cart.v1";
function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }catch(e){ return []; } }
function saveCart(items){ localStorage.setItem(CART_KEY, JSON.stringify(items)); updateCartBadge(); }
function addToCart(id, qty=1){
  const items = getCart();
  const idx = items.findIndex(it => it.id === id);
  if(idx >= 0){ items[idx].qty += qty; }
  else {
    const p = window.PRODUCTS[id];
    if(!p) return;
    items.push({ id, name: p.name, price: p.price, qty });
  }
  saveCart(items);
}
function removeFromCart(id){
  saveCart(getCart().filter(it => it.id !== id));
}
function updateQty(id, qty){
  const items = getCart().map(it => it.id === id ? {...it, qty: Math.max(1, qty)} : it);
  saveCart(items);
}
function cartTotals(){
  const items = getCart();
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  return { items, subtotal, total: subtotal }; // Extend for shipping/tax if needed
}
function updateCartBadge(){
  const badge = document.getElementById("cartCount");
  if(!badge) return;
  const count = getCart().reduce((s,it)=>s+it.qty,0);
  badge.textContent = count || 0;
}
document.addEventListener("DOMContentLoaded", updateCartBadge);

// Product list rendering (for products.html)
function renderProductsGrid(){
  const grid = document.getElementById("productsGrid");
  const sortVal = (document.getElementById("sortSelect") && document.getElementById("sortSelect").value) || "name_asc";
  const products = Object.values(window.PRODUCTS);

  // Sorting
  products.sort((a,b)=>{
    switch(sortVal){
      case "price_asc": return a.price - b.price;
      case "price_desc": return b.price - a.price;
      case "rating_desc": return (b.rating||0) - (a.rating||0);
      case "name_asc":
      default: return a.name.localeCompare(b.name);
    }
  });
  if(!grid) return;
  grid.innerHTML = "";
  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <a href="product-details.html?id=${p.id}"><img src="${(p.images&&p.images[0])||''}" alt="${p.name}"></a>
      <h4><a href="product-details.html?id=${p.id}&img=${encodeURIComponent((p.images&&p.images[0])||'images/placeholder.svg')}">${p.name}</a></h4>
      <div class="rating" aria-label="Rated ${p.rating} out of 5">
        <i class="fa fa-star" aria-hidden="true"></i>
        <i class="fa fa-star" aria-hidden="true"></i>
        <i class="fa fa-star" aria-hidden="true"></i>
        <i class="fa fa-star" aria-hidden="true"></i>
        <i class="fa ${p.rating>=4.5?'fa-star-half-o':'fa-star-o'}" aria-hidden="true"></i>
      </div>
      <p class="price">$${p.price.toFixed(2)}</p>
      <button class="btn" data-add="${p.id}" aria-label="Add ${p.name} to cart">Add to Cart &#43;</button>
    `;
    grid.appendChild(card);
  });
  // wire up add buttons
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect && !sortSelect._wired){
    sortSelect.addEventListener("change", renderProductsGrid);
    sortSelect._wired = true;
  }

  grid.addEventListener("click", (e)=>{
    const id = e.target && e.target.getAttribute("data-add");
    if(!id) return;
    addToCart(id, 1);
  });
}

// Product detail rendering (for product-details.html)
function renderProductDetail(){
  const root = document.getElementById("productDetail");
  if(!root) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || "jacket";
  const p = window.PRODUCTS[id];
  if(!p){ root.innerHTML = "<p>Product not found.</p>"; return; }

  // Gallery
  const hero = document.getElementById("heroImg");
  const thumbs = document.getElementById("thumbs");
  const images = (p.images || []).filter(Boolean);
  hero.src = images[0] || "";
  hero.alt = p.name;

  // Only show thumbnails for additional images beyond the hero
  const extra = images.length > 1 ? images.slice(1,5) : [];
  if (extra.length){
    thumbs.innerHTML = extra.map((src,i)=>`<img src="${src}" alt="${p.name} ${i+2}" data-large="${src}">`).join("");
    thumbs.parentElement.style.display = "";
  } else {
    thumbs.innerHTML = "";
    thumbs.parentElement.style.display = "none";
  }

  // Info
  $("#prodName").textContent = p.name;
  const crumb = document.getElementById("prodNameCrumb");
  if (crumb) crumb.textContent = p.name;
  $("#prodPrice").textContent = `$${p.price.toFixed(2)}`;
  $("#prodDesc").textContent = p.description;

  // Qty + Add
  const addBtn = document.getElementById("addToCartBtn");
  addBtn.addEventListener("click", (e)=>{
    e.preventDefault();
    const qty = parseInt(document.getElementById("qty").value || "1", 10);
    addToCart(p.id, qty);
    location.href = "cart.html";
  });

  // thumbs click
  thumbs.addEventListener("click", (e)=>{
    const target = e.target;
    if(target && target.dataset.large){
      hero.src = target.dataset.large;
    }
  });
}

// Cart page rendering (for cart.html)
function renderCartPage(){
  const tableBody = document.getElementById("cartBody");
  if(!tableBody) return;
  const emptyBox = document.getElementById("cartEmpty");
  const totalsEl = document.getElementById("cartTotals");
  const data = cartTotals();

  if(data.items.length === 0){
    emptyBox.style.display = "block";
    totalsEl.querySelector("[data-subtotal]").textContent = "$0.00";
    totalsEl.querySelector("[data-total]").textContent = "$0.00";
    tableBody.innerHTML = "";
    return;
  } else {
    emptyBox.style.display = "none";
  }

  tableBody.innerHTML = data.items.map(it => `
    <tr>
      <td>${it.name}</td>
      <td>$${it.price.toFixed(2)}</td>
      <td><input class="qty-input" type="number" min="1" value="${it.qty}" data-qty="${it.id}"></td>
      <td>$${(it.price * it.qty).toFixed(2)}</td>
      <td><button class="btn" data-remove="${it.id}">Remove</button></td>
    </tr>
  `).join("");

  totalsEl.querySelector("[data-subtotal]").textContent = `$${data.subtotal.toFixed(2)}`;
  totalsEl.querySelector("[data-total]").textContent = `$${data.total.toFixed(2)}`;

  document.getElementById("updateCartBtn").addEventListener("click", ()=>{
    // read all qty inputs and update
    $$(".qty-input").forEach(inp => {
      const id = inp.getAttribute("data-qty");
      const qty = parseInt(inp.value || "1", 10);
      updateQty(id, qty);
    });
    // re-render to show new totals
    renderCartPage();
  });

  tableBody.addEventListener("click", (e)=>{
    const id = e.target && e.target.getAttribute("data-remove");
    if(!id) return;
    removeFromCart(id);
    renderCartPage();
  });
}

// Initialize per-page
document.addEventListener("DOMContentLoaded", function(){
  renderProductsGrid();
  renderProductDetail();
  renderCartPage();
});
