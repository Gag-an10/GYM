const products = [
  { id: "db", name: "Adjustable Dumbbells", cat: "equipment", price: 249, blurb: "5–52.5 lb pair for progressive home lifting." },
  { id: "kb", name: "Competition Kettlebell", cat: "equipment", price: 89, blurb: "24 kg cast bell with a smooth steel handle." },
  { id: "bench", name: "Flat Utility Bench", cat: "equipment", price: 179, blurb: "11-gauge frame, rated for heavy pressing." },
  { id: "bands", name: "Resistance Band Set", cat: "equipment", price: 36, blurb: "Five latex bands from warm-up to assisted pull-ups." },
  { id: "whey", name: "Whey Isolate", cat: "supplements", price: 54, blurb: "25 g protein, low lactose, unflavored or cocoa." },
  { id: "creatine", name: "Creatine Monohydrate", cat: "supplements", price: 28, blurb: "5 g daily. Micronized, unflavored, 90 servings." },
  { id: "pre", name: "Daily Pre-Workout", cat: "supplements", price: 39, blurb: "Caffeine, beta-alanine, and citrulline. No proprietary blend." },
  { id: "bars", name: "Protein Bars — 12 pack", cat: "supplements", price: 32, blurb: "20 g protein, pocket-size, chocolate peanut." },
  { id: "belt", name: "4\" Lifting Belt", cat: "essentials", price: 68, blurb: "Single-prong leather belt for squats and deads." },
  { id: "straps", name: "Lifting Straps", cat: "essentials", price: 18, blurb: "Cotton straps with neoprene padding." },
  { id: "shaker", name: "Leakproof Shaker", cat: "essentials", price: 14, blurb: "24 oz bottle with mixer grid and carry loop." },
  { id: "bag", name: "Gym Duffle", cat: "essentials", price: 58, blurb: "Shoe pocket, wet compartment, and strap loops." }
];

const grid = document.getElementById("grid");
const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("backdrop");
const searchInput = document.getElementById("productSearch");
const recentSearchesElement = document.getElementById("recentSearches");
const accountDrawer = document.getElementById("accountDrawer");
const profileForm = document.getElementById("profileForm");
const profileStatus = document.getElementById("profileStatus");
const storedProfile = loadStorage("ironbase.profile", {});
let cart = loadStorage("ironbase.cart", []);
let recentSearches = loadStorage("ironbase.searches", []);
let orders = loadStorage("ironbase.orders", []);
let profile = storedProfile && typeof storedProfile === "object" && !Array.isArray(storedProfile)
  ? storedProfile
  : {};
let active = "all";

if (!Array.isArray(cart)) cart = [];
if (!Array.isArray(recentSearches)) recentSearches = [];
recentSearches = recentSearches.filter((query) => typeof query === "string");
if (!Array.isArray(orders)) orders = [];

document.getElementById("profileName").value = profile.name || "";
document.getElementById("profileEmail").value = profile.email || "";

function loadStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function money(n) {
  return `$${n.toFixed(0)}`;
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const list = products.filter((p) => {
    const matchesCategory = active === "all" || p.cat === active;
    const matchesSearch = !query || `${p.name} ${p.cat} ${p.blurb}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  if (!list.length) {
    grid.innerHTML = `<p class="empty-result">No products found. Try another search.</p>`;
    return;
  }
  grid.innerHTML = list.map((p) => `
    <article class="card" id="${p.cat}">
      <span class="tag">${p.cat}</span>
      <h3>${p.name}</h3>
      <p>${p.blurb}</p>
      <div class="price-row">
        <span class="price">${money(p.price)}</span>
        <button class="btn" data-add="${p.id}" type="button">Add</button>
      </div>
    </article>
  `).join("");
}

function renderCart() {
  const count = cart.reduce((n, i) => n + i.qty, 0);
  const total = cart.reduce((n, i) => n + i.qty * i.price, 0);
  cartCount.textContent = count;
  cartTotal.textContent = money(total);
  cartItems.innerHTML = cart.length
    ? cart.map((i) => `<li><span>${escapeHTML(i.name)} × ${i.qty}</span><span>${money(i.price * i.qty)}</span></li>`).join("")
    : `<li class="empty">Cart is empty.</li>`;
  saveStorage("ironbase.cart", cart);
}

function openCart(open) {
  accountDrawer.hidden = true;
  drawer.hidden = !open;
  backdrop.hidden = !open;
}

function openAccount(open) {
  drawer.hidden = true;
  accountDrawer.hidden = !open;
  backdrop.hidden = !open;
  if (open) renderOrders();
}

function renderRecentSearches() {
  const searches = recentSearches.filter((query) => typeof query === "string").slice(0, 5);
  recentSearchesElement.innerHTML = searches.length
    ? `<span class="recent-label">Recent searches</span>${searches.map((query) => `
        <button class="recent-search" type="button" data-query="${escapeHTML(query)}">${escapeHTML(query)}</button>
      `).join("")}`
    : `<span class="recent-label">No recent searches</span>`;
  recentSearchesElement.hidden = false;
}

function recordSearch(query) {
  const normalized = query.trim();
  if (!normalized) return;
  recentSearches = [normalized, ...recentSearches.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 5);
  saveStorage("ironbase.searches", recentSearches);
  renderRecentSearches();
}

function renderOrders() {
  const orderHistory = document.getElementById("orderHistory");
  orderHistory.innerHTML = orders.length
    ? orders.map((order) => {
        const date = new Date(order.createdAt).toLocaleDateString();
        const items = Array.isArray(order.items) ? order.items : [];
        return `<article class="order-entry">
          <div class="order-heading"><strong>Demo order</strong><span>${escapeHTML(date)}</span></div>
          <p>${items.map((item) => `${escapeHTML(item.name)} × ${Number(item.qty) || 0}`).join(", ")}</p>
          <strong>${money(Number(order.total) || 0)}</strong>
        </article>`;
      }).join("")
    : `<p class="empty">No previous demo orders yet.</p>`;
}

grid.addEventListener("click", (e) => {
  const id = e.target.dataset.add;
  if (!id) return;
  const product = products.find((p) => p.id === id);
  const line = cart.find((i) => i.id === id);
  if (line) line.qty += 1;
  else cart.push({ ...product, qty: 1 });
  renderCart();
  openCart(true);
});

document.querySelectorAll(".filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    active = btn.dataset.filter;
    document.querySelectorAll(".filter").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });
});

document.getElementById("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  recordSearch(searchInput.value);
  recentSearchesElement.hidden = true;
  searchInput.blur();
});

searchInput.addEventListener("input", () => {
  render();
  recentSearchesElement.hidden = Boolean(searchInput.value.trim());
});

searchInput.addEventListener("focus", () => {
  if (!searchInput.value.trim()) renderRecentSearches();
});

recentSearchesElement.addEventListener("click", (event) => {
  const button = event.target.closest("[data-query]");
  if (!button) return;
  searchInput.value = button.dataset.query;
  recentSearchesElement.hidden = true;
  render();
});

document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".search-form")) recentSearchesElement.hidden = true;
});

document.getElementById("clearSearch").addEventListener("click", () => {
  searchInput.value = "";
  render();
  searchInput.focus();
});

document.getElementById("openCart").addEventListener("click", () => openCart(true));
document.getElementById("closeCart").addEventListener("click", () => openCart(false));
document.getElementById("openAccount").addEventListener("click", () => openAccount(true));
document.getElementById("closeAccount").addEventListener("click", () => openAccount(false));
backdrop.addEventListener("click", () => {
  openCart(false);
  openAccount(false);
});

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  profile = {
    name: document.getElementById("profileName").value.trim(),
    email: document.getElementById("profileEmail").value.trim()
  };
  profileStatus.textContent = saveStorage("ironbase.profile", profile)
    ? "Profile saved in this browser."
    : "Could not save profile in this browser.";
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    openCart(false);
    openAccount(false);
  }
});

document.getElementById("checkout").addEventListener("click", () => {
  if (!cart.length) return;
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  orders = [{
    createdAt: new Date().toISOString(),
    total,
    items: cart.map(({ id, name, price, qty }) => ({ id, name, price, qty }))
  }, ...orders].slice(0, 20);
  saveStorage("ironbase.orders", orders);
  alert("Demo order saved to this browser. No payment was processed.");
  cart = [];
  renderCart();
  renderOrders();
  openCart(false);
});

render();
renderCart();
