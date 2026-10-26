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
let cart = [];
let active = "all";

function money(n) {
  return `$${n.toFixed(0)}`;
}

function render() {
  const list = products.filter((p) => active === "all" || p.cat === active);
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
    ? cart.map((i) => `<li><span>${i.name} × ${i.qty}</span><span>${money(i.price * i.qty)}</span></li>`).join("")
    : `<li class="empty">Cart is empty.</li>`;
}

function openCart(open) {
  drawer.hidden = !open;
  backdrop.hidden = !open;
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

document.getElementById("openCart").addEventListener("click", () => openCart(true));
document.getElementById("closeCart").addEventListener("click", () => openCart(false));
backdrop.addEventListener("click", () => openCart(false));
document.getElementById("checkout").addEventListener("click", () => {
  if (!cart.length) return;
  alert("Demo checkout only. Connect a payment provider before going live.");
  cart = [];
  renderCart();
  openCart(false);
});

render();
renderCart();
