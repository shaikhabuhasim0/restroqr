/* =============================================
   CART.JS — Render cart, manage items, totals
   ============================================= */

function renderCart() {
  const cart = getCart();
  const listEl = document.getElementById('cartList');
  const emptyEl = document.getElementById('cartEmpty');
  const summaryEl = document.getElementById('cartSummary');
  const actionsEl = document.getElementById('cartActions');

  if (cart.length === 0) {
    if (listEl) listEl.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    if (summaryEl) summaryEl.classList.add('hidden');
    if (actionsEl) actionsEl.classList.add('hidden');
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');
  if (summaryEl) summaryEl.classList.remove('hidden');
  if (actionsEl) actionsEl.classList.remove('hidden');

  if (listEl) {
    listEl.innerHTML = cart.map((item, idx) => `
      <div class="cart-item" data-index="${idx}">
        <img class="cart-item-img" src="${item.image || 'https://via.placeholder.com/80x80'}" alt="${item.name}"
             onerror="this.src='https://via.placeholder.com/80x80/F0E4CC/6B1F2A?text=Item'">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          ${item.note ? `<div class="cart-item-note">📝 ${item.note}</div>` : ''}
          <div class="cart-item-controls">
            <div class="qty-selector">
              <button class="cart-qty-minus" data-index="${idx}">−</button>
              <span>${item.quantity}</span>
              <button class="cart-qty-plus" data-index="${idx}">+</button>
            </div>
            <span style="font-size:0.82rem;color:var(--text-light)">× ₹${item.price}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
          <button class="remove-btn" data-index="${idx}" title="Remove">🗑️</button>
          <span class="cart-item-price">${formatPrice(item.price * item.quantity)}</span>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.cart-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        updateCartQty(parseInt(btn.dataset.index), -1);
        renderCart();
      });
    });
    listEl.querySelectorAll('.cart-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        updateCartQty(parseInt(btn.dataset.index), 1);
        renderCart();
      });
    });
    listEl.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFromCart(parseInt(btn.dataset.index));
        renderCart();
        showToast('Item removed from cart.', 'error');
      });
    });
  }

  if (summaryEl) {
    const { subtotal, gst, serviceCharge, total } = calcTotals(cart);
    summaryEl.querySelector('.subtotal-val').textContent = formatPrice(subtotal);
    summaryEl.querySelector('.gst-val').textContent = formatPrice(gst);
    summaryEl.querySelector('.service-val').textContent = formatPrice(serviceCharge);
    summaryEl.querySelector('.total-val').textContent = formatPrice(total);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();

  const clearBtn = document.getElementById('clearCartBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all items from cart?')) {
        clearCart();
        renderCart();
        showToast('Cart cleared.', 'error');
      }
    });
  }

  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const table = getTableNumber();
      const suffix = table ? `?table=${table}` : '';
      window.location.href = '/checkout.html' + suffix;
    });
  }

  const continueBtn = document.getElementById('continueShoppingBtn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      const table = getTableNumber();
      const suffix = table ? `?table=${table}` : '';
      window.location.href = '/menu.html' + suffix;
    });
  }
});