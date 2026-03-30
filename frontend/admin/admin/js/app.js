const API_BASE = window.location.origin;

/* ── Auth ─────────────────────────────────────────────────── */
const Auth = {
  isLoggedIn() {
    return !!sessionStorage.getItem('rq_session') || !!localStorage.getItem('rq_remember');
  },
  async login(id, password, remember) {
    try {
      const res = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: id, password: password })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('rq_session', '1');
        if (remember) localStorage.setItem('rq_remember', '1');
        else localStorage.removeItem('rq_remember');
        return true;
      }
      return false;
    } catch (e) {
      // Fallback: hardcoded check agar API nahi bani abhi
      if (id === 'admin' && password === 'admin123') {
        sessionStorage.setItem('rq_session', '1');
        if (remember) localStorage.setItem('rq_remember', '1');
        else localStorage.removeItem('rq_remember');
        return true;
      }
      return false;
    }
  },
  logout() {
    sessionStorage.removeItem('rq_session');
    localStorage.removeItem('rq_remember');
    window.location.href = '/admin';
  },
  guard() {
    if (!this.isLoggedIn()) window.location.href = '/admin';
  }
};

/* ── Sidebar HTML ─────────────────────────────────────────── */
function renderSidebar(activePage, restaurantName = 'RestroQR') {
  const nav = [
    { id: 'dashboard',  icon: '⊞',  label: 'Dashboard',       href: '/admin/dashboard' },
    { id: 'orders',     icon: '🧾', label: 'Orders',           href: '/admin/orders' },
    { id: 'menu',       icon: '🍽️', label: 'Menu',             href: '/admin/menu' },
    { id: 'categories', icon: '🏷️', label: 'Categories',       href: '/admin/categories' },
    { id: 'tables',     icon: '📱', label: 'Tables & QR',      href: '/admin/tables' },
    { id: 'offers',     icon: '🎟️', label: 'Offers & Coupons', href: '/admin/offers' },
    { id: 'customers',  icon: '👥', label: 'Customers',        href: '/admin/customers' },
    { id: 'payments',   icon: '💳', label: 'Payments',         href: '/admin/payments' },
    { id: 'settings',   icon: '⚙️', label: 'Settings',         href: '/admin/settings' },
  ];
  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">🍴</span>
        <span class="brand-name">${restaurantName}</span>
      </div>
      <nav class="sidebar-nav">
        ${nav.map(n => `
          <a href="${n.href}" class="nav-item ${activePage === n.id ? 'active' : ''}">
            <span class="nav-icon">${n.icon}</span>
            <span class="nav-label">${n.label}</span>
          </a>`).join('')}
      </nav>
      <div class="sidebar-footer">
        <button class="logout-btn" onclick="Auth.logout()">
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>`;
}

/* ── Topbar HTML ──────────────────────────────────────────── */
function renderTopbar(title, pendingCount = 0) {
  return `
    <header class="topbar">
      <div class="topbar-left">
        <button class="menu-toggle" onclick="toggleSidebar()">☰</button>
        <h1 class="page-title">${title}</h1>
      </div>
      <div class="topbar-right">
        ${pendingCount > 0 ? `<div class="notif-badge" title="${pendingCount} new orders">🔔 <span>${pendingCount}</span></div>` : ''}
        <div class="admin-avatar">A</div>
        <span class="admin-name">Admin</span>
      </div>
    </header>`;
}

/* ── Sidebar toggle ───────────────────────────────────────── */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
  document.querySelector('.main-content')?.classList.toggle('expanded');
}

/* ── Toast ────────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  let cont = document.getElementById('toast-container');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'toast-container';
    document.body.appendChild(cont);
  }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  cont.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

/* ── Modal ────────────────────────────────────────────────── */
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

/* ── Confirm dialog ───────────────────────────────────────── */
function confirmDialog(msg, onYes) {
  const d = document.createElement('div');
  d.className = 'confirm-overlay';
  d.innerHTML = `
    <div class="confirm-box">
      <p>${msg}</p>
      <div class="confirm-btns">
        <button class="btn btn-danger" id="cfm-yes">Yes, Delete</button>
        <button class="btn btn-outline" id="cfm-no">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(d);
  document.getElementById('cfm-yes').onclick = () => { onYes(); d.remove(); };
  document.getElementById('cfm-no').onclick  = () => d.remove();
}

/* ── Format helpers ───────────────────────────────────────── */
function fmtCurrency(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDateOnly(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function statusBadge(status) {
  const map = {
    pending:   'badge-warn',
    preparing: 'badge-info',
    ready:     'badge-ready',
    completed: 'badge-success',
    rejected:  'badge-danger',
    available: 'badge-success',
    occupied:  'badge-danger',
    reserved:  'badge-warn'
  };
  return `<span class="badge ${map[status] || 'badge-info'}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

/* ── Page scaffold ────────────────────────────────────────── */
async function buildPage(activePage, title, contentHtml) {
  Auth.guard();

  // Settings fetch karo restaurant name ke liye (optional, fail hone par default use karo)
  let restaurantName = 'RestroQR';
  let pendingCount = 0;
  try {
    const [settingsRes, ordersRes] = await Promise.all([
      fetch('/getSettings').catch(() => null),
      fetch('/getOrders').catch(() => null)
    ]);
    if (settingsRes && settingsRes.ok) {
      const sd = await settingsRes.json();
      if (sd.success && sd.settings?.name) restaurantName = sd.settings.name;
    }
    if (ordersRes && ordersRes.ok) {
      const od = await ordersRes.json();
      if (od.success) {
        pendingCount = (od.orders || []).filter(o =>
          o.status === 'Pending' || o.status === 'pending'
        ).length;
      }
    }
  } catch (e) {
    // silent fail — defaults use honge
  }

  document.body.innerHTML = `
    ${renderSidebar(activePage, restaurantName)}
    <div class="main-content" id="main-content">
      ${renderTopbar(title, pendingCount)}
      <main class="content-area">
        ${contentHtml}
      </main>
    </div>
    <div id="toast-container"></div>`;
}