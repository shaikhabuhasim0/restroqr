/* =============================================
   STATUS.JS — Order status tracking
   ============================================= */

const STATUS_STEPS = [
  { label: 'Placed', icon: '📋' },
  { label: 'Accepted', icon: '✅' },
  { label: 'Preparing', icon: '👨‍🍳' },
  { label: 'Ready', icon: '🍽️' },
  { label: 'Completed', icon: '🎉' }
];

// Map admin status strings to step index
const STATUS_MAP = {
  'Pending':    0,
  'Accepted':   1,
  'Preparing':  2,
  'Ready':      3,
  'Completed':  4
};

let currentStatusIndex = 0;
let pollTimer = null;

function getOrder() {
  try {
    return JSON.parse(localStorage.getItem('lastOrder'));
  } catch { return null; }
}

function renderStatus() {
  const order = getOrder();
  const wrapper = document.getElementById('statusWrapper');
  const noOrder = document.getElementById('noOrderMsg');

  if (!order) {
    if (wrapper) wrapper.classList.add('hidden');
    if (noOrder) noOrder.classList.remove('hidden');
    return;
  }

  if (wrapper) wrapper.classList.remove('hidden');
  if (noOrder) noOrder.classList.add('hidden');

  const orderIdEl = document.getElementById('statusOrderId');
  const tableEl   = document.getElementById('statusTable');
  const timeEl    = document.getElementById('statusTime');

  if (orderIdEl) orderIdEl.textContent = order.orderId || '#' + Date.now().toString().slice(-4);
  if (tableEl)   tableEl.textContent   = 'Table ' + (order.table || '?');
  if (timeEl) {
    const d = new Date(order.placedAt || Date.now());
    timeEl.textContent = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  const itemsList = document.getElementById('statusItemsList');
  if (itemsList && order.items) {
    itemsList.innerHTML = order.items.map(item => `
      <div class="order-item-row">
        <span class="order-item-name">
          ${item.name}
          <span class="order-item-qty">× ${item.quantity}</span>
        </span>
        <span class="order-item-price">${formatPrice(item.price * item.quantity)}</span>
      </div>
    `).join('');
  }

  const totalEl = document.getElementById('statusTotal');
  if (totalEl) totalEl.textContent = formatPrice(order.total || 0);

  const nameEl = document.getElementById('statusCustomer');
  if (nameEl) nameEl.textContent = order.customerName || '';

  // Start polling real status from API
  startPolling(order.orderId);
}

function renderSteps(activeIdx) {
  const stepsContainer = document.getElementById('statusSteps');
  if (!stepsContainer) return;

  stepsContainer.innerHTML = `
    <div class="status-steps" id="stepsRow">
      <div class="status-progress-line" id="progressLine"></div>
      ${STATUS_STEPS.map((step, i) => `
        <div class="step ${i < activeIdx ? 'done' : i === activeIdx ? 'active' : ''}" data-index="${i}">
          <div class="step-circle">${i < activeIdx ? '✓' : step.icon}</div>
          <span class="step-label">${step.label}</span>
        </div>
      `).join('')}
    </div>
  `;

  setTimeout(() => {
    const line = document.getElementById('progressLine');
    const row  = document.getElementById('stepsRow');
    if (line && row) {
      const totalSteps = STATUS_STEPS.length - 1;
      const pct = activeIdx === 0 ? 0 : (activeIdx / totalSteps) * 100;
      line.style.width = pct + '%';
    }
  }, 50);
}

// ✅ Poll API every 5 seconds to get REAL status from admin
async function startPolling(orderId) {
  if (!orderId) return;

  // Clear any existing timer
  if (pollTimer) clearInterval(pollTimer);

  const fetchStatus = async () => {
    try {
      const res  = await fetch('/getOrders');
      const data = await res.json();

      if (!data.success) return;

      const order = data.orders.find(o => o.id == orderId);
      if (!order) return;

      const newIdx = STATUS_MAP[order.status] ?? 0;

      // Only update UI if status actually changed
      if (newIdx !== currentStatusIndex) {
        currentStatusIndex = newIdx;
        renderSteps(newIdx);

        if (newIdx === STATUS_STEPS.length - 1) {
          showToast('🎉 Your order is ready! Enjoy your meal!');
          clearInterval(pollTimer); // Stop polling once completed
        } else {
          showToast(`Status updated: ${STATUS_STEPS[newIdx].label} ${STATUS_STEPS[newIdx].icon}`);
        }
      }
    } catch (e) {
      console.error('Status fetch failed:', e);
    }
  };

  // Fetch immediately, then every 5 seconds
  await fetchStatus();
  pollTimer = setInterval(fetchStatus, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
  renderStatus();

  document.querySelectorAll('.waiter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action   = btn.dataset.action;
      const table    = getTableNumber() || '?';
      const requests = JSON.parse(localStorage.getItem('waiterRequests') || '[]');
      requests.push({ action, table, time: new Date().toISOString() });
      localStorage.setItem('waiterRequests', JSON.stringify(requests));
      btn.classList.add('sent');
      btn.innerHTML = '✅ Sent!';
      btn.disabled  = true;
      showToast(`✅ ${btn.dataset.label} request sent to waiter!`);
      setTimeout(() => {
        btn.classList.remove('sent');
        btn.innerHTML = btn.dataset.icon + ' ' + btn.dataset.label;
        btn.disabled  = false;
      }, 10000);
    });
  });

  const menuBtn = document.getElementById('backToMenuBtn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const table = getTableNumber();
      window.location.href = '/menu.html' + (table ? `?table=${table}` : '');
    });
  }
});