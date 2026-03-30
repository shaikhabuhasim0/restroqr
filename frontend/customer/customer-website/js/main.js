const API_BASE = window.location.origin;
/* =============================================
   MAIN.JS — Shared utilities for all pages
   ============================================= */

/* ---- Table Number Management ---- */
function getTableNumber() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('table');
  if (fromUrl) {
    localStorage.setItem('tableNumber', fromUrl);
    return fromUrl;
  }
  return localStorage.getItem('tableNumber');
}

function setTableNumberManually(num) {
  localStorage.setItem('tableNumber', num);
  window.location.reload();
}

function initTableBanner() {
  const table = getTableNumber();
  const banner = document.getElementById('tableBanner');
  if (!banner) return;
  if (table) {
    banner.innerHTML = `
      <span class="table-icon">🪑</span>
      You are seated at 
      <span class="table-number">Table ${table}</span>
      — Welcome to <strong>La Bella Casa</strong>
    `;
  } else {
    banner.innerHTML = `<span class="table-icon">⚠️</span> Table number not detected. Please scan the QR code on your table.`;
  }
}

/* ---- Cart Count in Nav ---- */
function updateNavCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

/* ---- Cart Helpers ---- */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart')) || [];
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateNavCartCount();
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(c => c.id === item.id && c.note === item.note);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push({ ...item });
  }
  saveCart(cart);
  showToast(`🛒 "${item.name}" added to cart!`);
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function updateCartQty(index, delta) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) cart.splice(index, 1);
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem('cart');
  updateNavCartCount();
}

/* ---- Pricing ---- */
const GST_RATE = 0.05;
const SERVICE_CHARGE_RATE = 0.02;

function calcTotals(cart) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gst = Math.round(subtotal * GST_RATE);
  const serviceCharge = Math.round(subtotal * SERVICE_CHARGE_RATE);
  const total = subtotal + gst + serviceCharge;
  return { subtotal, gst, serviceCharge, total };
}

function formatPrice(n) {
  return '₹' + n.toLocaleString('en-IN');
}

/* ---- Toast ---- */
let toastTimer = null;
function showToast(msg, type = '') {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.className = 'toast' + (type ? ' ' + type : '');
  toast.innerHTML = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ---- Preserve table query in nav links ---- */
function injectTableParam() {
  const table = getTableNumber();
  if (!table) return;
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('http') && !href.includes('table=')) {
      const sep = href.includes('?') ? '&' : '?';
      a.setAttribute('href', href + sep + 'table=' + table);
    }
  });
}

/* ---- Init on every page ---- */
document.addEventListener('DOMContentLoaded', () => {
  initTableBanner();
  updateNavCartCount();
  injectTableParam();

  // Manual table entry fallback
  const manualForm = document.getElementById('manualTableForm');
  if (manualForm) {
    manualForm.addEventListener('submit', e => {
      e.preventDefault();
      const val = document.getElementById('manualTableInput').value.trim();
      if (val) setTableNumberManually(val);
    });
  }
});
