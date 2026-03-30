const params = new URLSearchParams(window.location.search);
window.tableNumber = params.get("table");

console.log("Table Number:", window.tableNumber);

let allItems = [];
let activeCategory = 'All';
let searchQuery = '';

// ================= LOAD MENU =================
async function loadMenu() {
  const grid = document.getElementById('menuGrid');
  grid.innerHTML = '<div class="text-center" style="padding:48px;">Loading menu...</div>';

  try {
    const res = await fetch(API_BASE + '/getMenu');  // ✅ FIXED
    const data = await res.json();

    if (!data.success) throw new Error("Menu load failed");

    allItems = [];
    for (let category in data.menu) {
      data.menu[category].forEach(item => {
        allItems.push({
          ...item,
          category: category,
          image: item.image || "https://via.placeholder.com/300x200",
          veg_or_nonveg: "veg",
          available: true
        });
      });
    }

    buildCategoryBar();
    renderMenu();

  } catch (err) {
    grid.innerHTML = `<div style="padding:48px;color:red;">Menu load failed</div>`;
    console.error(err);
  }
}

// ================= CATEGORY =================
function buildCategoryBar() {
  const categories = ['All', ...new Set(allItems.map(i => i.category))];
  const bar = document.getElementById('categoryBar');

  bar.innerHTML = categories.map(cat => `
    <button class="cat-btn${cat === 'All' ? ' active' : ''}" data-cat="${cat}">${cat}</button>
  `).join('');

  bar.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      bar.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMenu();
    });
  });
}

// ================= RENDER MENU =================
function renderMenu() {
  const grid = document.getElementById('menuGrid');
  let filtered = allItems;

  if (activeCategory !== 'All') {
    filtered = filtered.filter(i => i.category === activeCategory);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="padding:48px;">No items found</div>`;
    return;
  }

  grid.innerHTML = filtered.map(item => buildMenuCard(item)).join('');

  grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const item = allItems.find(i => i.id === id);
      addToCart({ ...item, quantity: 1 });
      if (typeof updateStickyBar === 'function') updateStickyBar();
    });
  });
}

// ================= MENU CARD =================
function buildMenuCard(item) {
  return `
    <div class="menu-card">
      <img src="${item.image}" style="width:100%;height:150px;object-fit:cover;" onerror="this.src='https://via.placeholder.com/300x200'">
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <div>₹${item.price}</div>
      <button class="add-to-cart-btn" data-id="${item.id}">Add to Cart</button>
    </div>
  `;
}

// ================= PLACE ORDER =================
function placeOrder() {
  const cart = getCart();
  const { total } = calcTotals(cart);

  fetch(API_BASE + "/place-order", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      table: window.tableNumber || getTableNumber(),
      items: cart,
      total: total
    })
  })
  .then(res => res.json())
  .then(data => {
    alert("Order placed!");
    clearCart();
  });
}

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();

  const searchInput = document.getElementById('menuSearch');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value;
      renderMenu();
    });
  }

  const placeBtn = document.getElementById("placeOrderBtn");
  if (placeBtn) {
    placeBtn.addEventListener("click", placeOrder);
  }
});