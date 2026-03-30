// orders.js — Flask API version

async function ordersInit() {
  Auth.guard();
  await renderOrders();
}

/* ── Status config ─────────────────────────────────────── */
const STATUS_CONFIG = {
  Pending:   { label: 'Pending',   emoji: '⏳', color: '#f39c12', bg: '#fff8e1', border: '#f39c12', glow: 'rgba(243,156,18,.18)' },
  Preparing: { label: 'Preparing', emoji: '🔥', color: '#2980b9', bg: '#e3f2fd', border: '#2980b9', glow: 'rgba(41,128,185,.18)' },
  Ready:     { label: 'Ready',     emoji: '🔔', color: '#8e44ad', bg: '#f3e5f5', border: '#8e44ad', glow: 'rgba(142,68,173,.18)' },
  Completed: { label: 'Completed', emoji: '✅', color: '#27ae60', bg: '#e8f5e9', border: '#27ae60', glow: 'rgba(39,174,96,.18)' },
  Rejected:  { label: 'Rejected',  emoji: '❌', color: '#e74c3c', bg: '#ffebee', border: '#e74c3c', glow: 'rgba(231,76,60,.18)' },
};

let _allOrders = [];

async function renderOrders(filter = 'all', search = '') {
  // Flask API se orders fetch karo
  try {
    const res = await fetch('/getOrders');
    const data = await res.json();
    _allOrders = data.success ? data.orders : [];
  } catch (e) {
    _allOrders = [];
  }

  let orders = [..._allOrders].sort((a, b) => new Date(b.time) - new Date(a.time));
  if (filter !== 'all') orders = orders.filter(o => o.status === filter);
  if (search) {
    const s = search.toLowerCase();
    orders = orders.filter(o =>
      String(o.id).toLowerCase().includes(s) ||
      String(o.table).toLowerCase().includes(s)
    );
  }

  const counts = { all: _allOrders.length };
  ['Pending','Preparing','Ready','Completed','Rejected'].forEach(s => {
    counts[s] = _allOrders.filter(o => o.status === s).length;
  });

  const tabConfig = [
    { key: 'all',       emoji: '📋', label: 'All' },
    { key: 'Pending',   emoji: '⏳', label: 'Pending' },
    { key: 'Preparing', emoji: '🔥', label: 'Preparing' },
    { key: 'Ready',     emoji: '🔔', label: 'Ready' },
    { key: 'Completed', emoji: '✅', label: 'Completed' },
    { key: 'Rejected',  emoji: '❌', label: 'Rejected' },
  ];

  const content = `
    <style>
      .order-tabs { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
      .order-tab { display:flex; align-items:center; gap:6px; padding:9px 18px; border-radius:50px; border:2px solid var(--border); background:#fff; font-size:.82rem; font-weight:700; cursor:pointer; transition:all .2s; color:var(--text-muted); }
      .order-tab:hover { border-color:var(--primary); color:var(--primary); transform:translateY(-1px); }
      .order-tab.active-all       { background:#2c1a0e; color:#fff; border-color:#2c1a0e; }
      .order-tab.active-Pending   { background:#f39c12; color:#fff; border-color:#f39c12; }
      .order-tab.active-Preparing { background:#2980b9; color:#fff; border-color:#2980b9; }
      .order-tab.active-Ready     { background:#8e44ad; color:#fff; border-color:#8e44ad; }
      .order-tab.active-Completed { background:#27ae60; color:#fff; border-color:#27ae60; }
      .order-tab.active-Rejected  { background:#e74c3c; color:#fff; border-color:#e74c3c; }
      .tab-count { background:rgba(255,255,255,.28); padding:1px 7px; border-radius:20px; font-size:.72rem; font-weight:800; }
      .order-tab:not([class*="active"]) .tab-count { background:var(--bg); color:var(--text); }
      .orders-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(310px,1fr)); gap:18px; }
      .order-card { background:#fff; border-radius:16px; border:2px solid var(--border); overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.06); transition:transform .2s,box-shadow .2s; }
      .order-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.12); }
      .order-card-header { padding:14px 16px 12px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px dashed var(--border); }
      .order-id { font-family:'Courier New',monospace; font-size:.82rem; font-weight:800; letter-spacing:.5px; }
      .order-status-pill { display:flex; align-items:center; gap:5px; padding:4px 12px; border-radius:30px; font-size:.75rem; font-weight:800; border:1.5px solid; }
      .order-card-body { padding:14px 16px; }
      .order-meta-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
      .order-table-badge { display:flex; align-items:center; gap:6px; background:var(--primary-light); color:var(--primary); font-weight:800; font-size:.85rem; padding:5px 12px; border-radius:8px; }
      .order-time { font-size:.75rem; color:var(--text-muted); display:flex; align-items:center; gap:4px; }
      .order-items-preview { background:var(--bg); border-radius:10px; padding:10px 12px; margin-bottom:12px; }
      .order-item-row { display:flex; align-items:center; justify-content:space-between; font-size:.82rem; padding:3px 0; color:var(--text); }
      .order-item-name { display:flex; align-items:center; gap:6px; }
      .order-item-qty { background:var(--primary); color:#fff; border-radius:4px; padding:1px 6px; font-size:.7rem; font-weight:800; }
      .order-price-row { display:flex; align-items:center; justify-content:space-between; padding:10px 0 0; border-top:1px dashed var(--border); margin-top:4px; }
      .order-total-amount { font-size:1.1rem; font-weight:800; color:var(--primary); }
      .order-card-actions { padding:12px 16px; border-top:1px solid var(--border); display:flex; gap:8px; flex-wrap:wrap; background:#faf8f5; }
      .action-btn { flex:1; min-width:80px; padding:9px 10px; border-radius:10px; border:none; font-size:.8rem; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; transition:all .18s; }
      .action-btn:hover { filter:brightness(.9); transform:translateY(-1px); }
      .btn-accept   { background:linear-gradient(135deg,#27ae60,#2ecc71); color:#fff; }
      .btn-reject   { background:linear-gradient(135deg,#e74c3c,#c0392b); color:#fff; }
      .btn-ready    { background:linear-gradient(135deg,#8e44ad,#9b59b6); color:#fff; }
      .btn-complete { background:linear-gradient(135deg,#27ae60,#1e8449); color:#fff; }
      .btn-view     { background:#fff; color:var(--text); border:1.5px solid var(--border); flex:0 0 auto; padding:9px 14px; }
      .orders-empty { grid-column:1/-1; text-align:center; padding:60px 20px; }
      .orders-empty .big-emoji { font-size:4rem; display:block; margin-bottom:12px; }
      .orders-empty p { font-size:1rem; color:var(--text-muted); font-weight:600; }
      .order-stats-strip { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
      .ostat { flex:1; min-width:90px; background:#fff; border-radius:12px; padding:12px 16px; border:1.5px solid var(--border); display:flex; align-items:center; gap:10px; box-shadow:0 1px 6px rgba(0,0,0,.05); transition:transform .18s; }
      .ostat:hover { transform:translateY(-2px); }
      .ostat-icon { font-size:1.4rem; }
      .ostat-val  { font-size:1.3rem; font-weight:800; line-height:1; }
      .ostat-lbl  { font-size:.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; }
    </style>

    <div class="section-header">
      <span class="section-title">🧾 Orders</span>
      <div style="font-size:.82rem;color:var(--text-muted);">Live kitchen tracker</div>
    </div>

    <!-- Stats strip -->
    <div class="order-stats-strip">
      <div class="ostat"><span class="ostat-icon">📋</span><div><div class="ostat-val">${counts.all}</div><div class="ostat-lbl">Total</div></div></div>
      <div class="ostat" style="border-color:#f39c12;"><span class="ostat-icon">⏳</span><div><div class="ostat-val" style="color:#f39c12;">${counts.Pending}</div><div class="ostat-lbl">Pending</div></div></div>
      <div class="ostat" style="border-color:#2980b9;"><span class="ostat-icon">🔥</span><div><div class="ostat-val" style="color:#2980b9;">${counts.Preparing}</div><div class="ostat-lbl">Preparing</div></div></div>
      <div class="ostat" style="border-color:#8e44ad;"><span class="ostat-icon">🔔</span><div><div class="ostat-val" style="color:#8e44ad;">${counts.Ready}</div><div class="ostat-lbl">Ready</div></div></div>
      <div class="ostat" style="border-color:#27ae60;"><span class="ostat-icon">✅</span><div><div class="ostat-val" style="color:#27ae60;">${counts.Completed}</div><div class="ostat-lbl">Done</div></div></div>
      <div class="ostat" style="border-color:#e74c3c;"><span class="ostat-icon">❌</span><div><div class="ostat-val" style="color:#e74c3c;">${counts.Rejected}</div><div class="ostat-lbl">Rejected</div></div></div>
    </div>

    <!-- Filter Tabs -->
    <div class="order-tabs">
      ${tabConfig.map(t => `
        <button class="order-tab ${filter === t.key ? 'active-' + t.key : ''}"
          onclick="renderOrders('${t.key}', document.getElementById('orderSearch').value)">
          ${t.emoji} ${t.label}
          <span class="tab-count">${counts[t.key] || 0}</span>
        </button>`).join('')}
    </div>

    <!-- Search -->
    <div style="margin-bottom:20px;">
      <input class="search-input" id="orderSearch" style="max-width:380px;display:block;"
        placeholder="🔍  Search order ID or table…"
        value="${search}"
        oninput="renderOrders('${filter}', this.value)">
    </div>

    <!-- Cards Grid -->
    <div class="orders-grid">
      ${orders.length === 0
        ? `<div class="orders-empty">
            <span class="big-emoji">${filter === 'all' ? '📭' : (STATUS_CONFIG[filter]?.emoji || '📭')}</span>
            <p>No ${filter === 'all' ? '' : filter} orders found</p>
           </div>`
        : orders.map(o => orderCard(o)).join('')}
    </div>

    <!-- Detail Modal -->
    <div class="modal-overlay" id="orderModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <span class="modal-title" id="orderModalTitle">Order Details</span>
          <button class="modal-close" onclick="closeModal('orderModal')">✕</button>
        </div>
        <div class="modal-body" id="orderModalBody"></div>
        <div class="modal-footer" id="orderModalFooter">
          <button class="btn btn-outline" onclick="closeModal('orderModal')">Close</button>
        </div>
      </div>
    </div>`;

  buildPage('orders', 'Orders', content);
}

/* ── Build one order card ───────────────────────────────── */
function orderCard(o) {
  const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.Pending;

  const timeStr = (() => {
    const diff = Math.floor((new Date() - new Date(o.time)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return diff + 'm ago';
    if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
    return fmtDateOnly(o.time);
  })();

  const actionBtns = (() => {
    if (o.status === 'Pending') return `
      <button class="action-btn btn-accept" onclick="updateStatus(${o.id},'Preparing')">🔥 Accept</button>
      <button class="action-btn btn-reject" onclick="updateStatus(${o.id},'Rejected')">✕ Reject</button>`;
    if (o.status === 'Preparing') return `
      <button class="action-btn btn-ready" onclick="updateStatus(${o.id},'Ready')">🔔 Mark Ready</button>`;
    if (o.status === 'Ready') return `
      <button class="action-btn btn-complete" onclick="updateStatus(${o.id},'Completed')">✅ Complete</button>`;
    return '';
  })();

  return `
    <div class="order-card" style="border-color:${cfg.border};box-shadow:0 4px 20px ${cfg.glow};">
      <div style="height:5px;background:linear-gradient(90deg,${cfg.color},${cfg.color}55);"></div>
      <div class="order-card-header">
        <div>
          <div class="order-id" style="color:${cfg.color};">#${o.id}</div>
          <div style="font-size:.7rem;color:var(--text-muted);margin-top:1px;">QR Order</div>
        </div>
        <div class="order-status-pill" style="color:${cfg.color};background:${cfg.bg};border-color:${cfg.border};">
          ${cfg.emoji} ${cfg.label}
        </div>
      </div>
      <div class="order-card-body">
        <div class="order-meta-row">
          <div class="order-table-badge">🪑 Table ${o.table}</div>
          <div class="order-time">🕐 ${timeStr}</div>
        </div>
        <div class="order-items-preview">
          ${o.items.slice(0, 3).map(i => `
            <div class="order-item-row">
              <div class="order-item-name">
                <span class="order-item-qty">${i.qty || i.quantity || 1}×</span>
                <span>${i.name}</span>
              </div>
              <span style="font-weight:700;color:var(--text-muted);">₹${i.price * (i.qty || i.quantity || 1)}</span>
            </div>`).join('')}
          ${o.items.length > 3 ? `<div style="font-size:.73rem;color:var(--text-muted);padding-top:5px;font-weight:600;">+${o.items.length - 3} more item${o.items.length - 3 > 1 ? 's' : ''}</div>` : ''}
        </div>
        <div class="order-price-row">
          <div>
            <div style="font-size:.68rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Total Amount</div>
            <div class="order-total-amount">${fmtCurrency(o.total)}</div>
          </div>
        </div>
      </div>
      <div class="order-card-actions">
        <button class="action-btn btn-view" onclick="viewOrder(${o.id})">👁️ View</button>
        ${actionBtns}
      </div>
    </div>`;
}

/* ── Update status via Flask API ────────────────────────── */
async function updateStatus(id, status) {
  try {
    const res = await fetch(`/updateOrderStatus/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      const msgs = {
        Preparing: '🔥 Accepted & sent to kitchen!',
        Ready:     '🔔 Order is ready to serve!',
        Completed: '✅ Order completed!',
        Rejected:  '❌ Order rejected'
      };
      showToast(msgs[status] || `Order ${status}`, status === 'Rejected' ? 'error' : 'success');
      await renderOrders();
    }
  } catch (e) {
    showToast('❌ Failed to update order', 'error');
  }
}

/* ── View detail modal ──────────────────────────────────── */
function viewOrder(id) {
  const order = _allOrders.find(o => o.id === id);
  if (!order) return;
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;

  document.getElementById('orderModalTitle').textContent = `🧾 Order — #${order.id}`;
  document.getElementById('orderModalBody').innerHTML = `
    <div style="background:${cfg.bg};border:1.5px solid ${cfg.border};border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;margin-bottom:18px;">
      <span style="font-size:2rem;">${cfg.emoji}</span>
      <div>
        <div style="font-weight:800;color:${cfg.color};font-size:1rem;">${cfg.label}</div>
        <div style="font-size:.78rem;color:var(--text-muted);">${fmtDate(order.time)}</div>
      </div>
      <div style="margin-left:auto;text-align:right;">
        <div style="font-size:.68rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Table</div>
        <div style="font-size:1.4rem;font-weight:800;color:var(--primary);">${order.table}</div>
      </div>
    </div>

    <div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:4px;">
      <div style="font-size:.72rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px;">🍽️ Ordered Items</div>
      ${order.items.map(i => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #e8e0d5;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="background:var(--primary);color:#fff;border-radius:5px;padding:2px 8px;font-size:.72rem;font-weight:800;">${i.qty || i.quantity || 1}×</span>
            <span style="font-weight:600;">${i.name}</span>
          </div>
          <span style="font-weight:800;color:var(--primary);">${fmtCurrency(i.price * (i.qty || i.quantity || 1))}</span>
        </div>`).join('')}
      <div style="margin-top:10px;padding-top:8px;">
        <div style="display:flex;justify-content:space-between;font-size:1.05rem;font-weight:800;padding:10px 0 2px;border-top:2px solid var(--border);">
          <span>Grand Total</span><span style="color:var(--primary);">${fmtCurrency(order.total)}</span>
        </div>
      </div>
    </div>`;

  document.getElementById('orderModalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal('orderModal')">Close</button>
    ${order.status === 'Pending' ? `
      <button class="btn btn-success" onclick="updateStatus(${order.id},'Preparing');closeModal('orderModal')">🔥 Accept & Prepare</button>
      <button class="btn btn-danger" onclick="updateStatus(${order.id},'Rejected');closeModal('orderModal')">✕ Reject</button>` : ''}
    ${order.status === 'Preparing' ? `
      <button class="btn btn-info" onclick="updateStatus(${order.id},'Ready');closeModal('orderModal')">🔔 Mark Ready</button>` : ''}
    ${order.status === 'Ready' ? `
      <button class="btn btn-success" onclick="updateStatus(${order.id},'Completed');closeModal('orderModal')">✅ Mark Completed</button>` : ''}`;

  openModal('orderModal');
}