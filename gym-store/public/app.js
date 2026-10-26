const grid = document.getElementById('grid');
const cartCount = document.getElementById('cartCount');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const drawer = document.getElementById('drawer');
const backdrop = document.getElementById('backdrop');
const searchInput = document.getElementById('searchInput');
const filters = document.querySelectorAll('.filter');

let cart = [];
let active = 'all';
let searchTerm = '';

function money(n) {
  return `$${Number(n).toFixed(0)}`;
}

function updateCartUI(items) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  cartCount.textContent = count;
  cartTotal.textContent = money(total);
  cartItems.innerHTML = items.length
    ? items.map((item) => `<li><span>${item.name} × ${item.quantity}</span><span>${money(item.price * item.quantity)}</span></li>`).join('')
    : '<li class="empty">Cart is empty.</li>';
}

function openCart(open) {
  drawer.hidden = !open;
  backdrop.hidden = !open;
}

async function fetchProducts() {
  const params = new URLSearchParams({ category: active, search: searchTerm });
  const response = await fetch(`/api/products?${params.toString()}`);
  const products = await response.json();

  if (!Array.isArray(products)) {
    throw new Error('Invalid products response');
  }

  grid.innerHTML = products.map((p) => `
    <article class="card" id="${p.category}">
      <span class="tag">${p.category}</span>
      <h3>${p.name}</h3>
      <p>${p.blurb}</p>
      <div class="price-row">
        <span class="price">${money(p.price)}</span>
        <button class="btn" data-add="${p.id}" type="button">Add</button>
      </div>
    </article>
  `).join('');
}

async function fetchCart() {
  const response = await fetch('/api/cart');
  const items = await response.json();
  cart = Array.isArray(items) ? items : [];
  updateCartUI(cart);
}

grid.addEventListener('click', async (event) => {
  const productId = event.target.dataset.add;
  if (!productId) return;

  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId })
  });

  if (response.ok) {
    await fetchCart();
    openCart(true);
  }
});

filters.forEach((button) => {
  button.addEventListener('click', () => {
    active = button.dataset.filter;
    filters.forEach((btn) => btn.classList.toggle('active', btn === button));
    fetchProducts().catch((error) => {
      console.error(error);
    });
  });
});

searchInput.addEventListener('input', (event) => {
  searchTerm = event.target.value.trim();
  fetchProducts().catch((error) => {
    console.error(error);
  });
});

document.getElementById('openCart').addEventListener('click', () => openCart(true));
document.getElementById('closeCart').addEventListener('click', () => openCart(false));
backdrop.addEventListener('click', () => openCart(false));

document.getElementById('checkout').addEventListener('click', async () => {
  if (!cart.length) return;
  alert('Demo checkout only. Connect a payment provider before going live.');

  await fetch('/api/cart', { method: 'DELETE' });
  await fetchCart();
  openCart(false);
});

fetchProducts().catch((error) => {
  console.error(error);
  grid.innerHTML = '<div class="empty">Unable to load products right now.</div>';
});
fetchCart();
