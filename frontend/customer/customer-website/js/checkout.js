/* =============================================
   CHECKOUT.JS — Order summary, place order
   ============================================= */

function renderCheckoutSummary() {
  const cart = getCart();
  const summaryList = document.getElementById('checkoutItemsList');
  const table = getTableNumber();

  const tableInput = document.getElementById('checkoutTable');
  if (tableInput) tableInput.value = table ? `Table ${table}` : 'Not set';

  if (!summaryList) return;

  if (cart.length === 0) {
    summaryList.innerHTML = '<p style="color:var(--text-light);font-size:0.9rem;">Your cart is empty.</p>';
    return;
  }

  summaryList.innerHTML = cart.map(item => `
    <div class="order-item-row">
      <span class="order-item-name">
        ${item.name}
        <span class="order-item-qty">× ${item.quantity}</span>
        ${item.note ? `<br><small style="color:var(--text-light);font-style:italic">📝 ${item.note}</small>` : ''}
      </span>
      <span class="order-item-price">${formatPrice(item.price * item.quantity)}</span>
    </div>
  `).join('');

  const { subtotal, gst, serviceCharge, total } = calcTotals(cart);
  document.getElementById('co-subtotal').textContent = formatPrice(subtotal);
  document.getElementById('co-gst').textContent = formatPrice(gst);
  document.getElementById('co-service').textContent = formatPrice(serviceCharge);
  document.getElementById('co-total').textContent = formatPrice(total);
}

async function placeOrder(name, phone, notes) {
  const cart = getCart();
  const table = getTableNumber();
  const { subtotal, gst, serviceCharge, total } = calcTotals(cart);

  try {
    const res = await fetch(API_BASE + "/place-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        table: table,
        customerName: name,
        customerPhone: phone,
        notes: notes,
        items: cart,
        subtotal: subtotal,
        gst: gst,
        serviceCharge: serviceCharge,
        total: total
      })
    });

    const data = await res.json();

    if (data.success) {
      return { success: true, orderId: data.orderId }; // ✅ Return real orderId from API
    } else {
      alert("Order failed! Please try again.");
      return { success: false };
    }

  } catch (err) {
    console.error(err);
    alert("Server error! Please try again.");
    return { success: false };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderCheckoutSummary();

  const cart = getCart();
  if (cart.length === 0) {
    const placeBtn = document.getElementById('placeOrderBtn');
    if (placeBtn) {
      placeBtn.disabled = true;
      placeBtn.textContent = 'Cart is Empty';
    }
  }

  const form = document.getElementById('checkoutForm');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const name  = document.getElementById('customerName').value.trim();
      const phone = document.getElementById('customerPhone').value.trim();
      const notes = document.getElementById('orderNotes').value.trim();

      if (!name)  { showToast('⚠️ Please enter your name.', 'error'); return; }
      if (!phone || phone.length < 10) { showToast('⚠️ Enter valid phone.', 'error'); return; }

      const cart = getCart();
      if (cart.length === 0) { showToast('⚠️ Cart empty!', 'error'); return; }

      const spinner = document.getElementById('orderSpinner');
      if (spinner) spinner.classList.remove('hidden');

      const currentCart = [...cart];
      const { total } = calcTotals(currentCart);

      const result = await placeOrder(name, phone, notes);

      if (spinner) spinner.classList.add('hidden');

      if (result.success) {
        const table = getTableNumber();

        // ✅ Save real orderId from API so status.js can poll correctly
        const lastOrder = {
          orderId: result.orderId,
          table: table,
          customerName: name,
          items: currentCart,
          total: total,
          placedAt: new Date().toISOString(),
          status: 0
        };
        localStorage.setItem('lastOrder', JSON.stringify(lastOrder));
        clearCart();
        const suffix = table ? '?table=' + table : '';
        window.location.href = '/success.html' + suffix;
      }
    });
  }

  document.querySelectorAll('.waiter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action   = btn.dataset.action;
      const table    = getTableNumber() || '?';
      const requests = JSON.parse(localStorage.getItem('waiterRequests') || '[]');
      requests.push({ action, table, time: new Date().toISOString() });
      localStorage.setItem('waiterRequests', JSON.stringify(requests));
      btn.classList.add('sent');
      btn.innerHTML = '✅ ' + btn.dataset.label;
      btn.disabled  = true;
      showToast(`✅ ${btn.dataset.label} request sent!`);
      setTimeout(() => {
        btn.classList.remove('sent');
        btn.innerHTML = btn.dataset.icon + ' ' + btn.dataset.label;
        btn.disabled  = false;
      }, 8000);
    });
  });
});