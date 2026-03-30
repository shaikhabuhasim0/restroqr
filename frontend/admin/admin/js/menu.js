// menu.js

let editingMenuId = null;
let _menuItems = [];

function menuInit() {
  Auth.guard();
  renderMenu();
}

async function loadMenuFromAPI() {
  try {
    const res = await fetch('/getMenu');
    const data = await res.json();
    let items = [];
    for (let category in data.menu) {
      data.menu[category].forEach(item => {
        items.push({ ...item, category, desc: item.description || '', veg: true, available: true });
      });
    }
    _menuItems = items;
    return items;
  } catch (e) {
    showToast('Menu load failed!', 'error');
    return [];
  }
}

async function renderMenu(filterCat = 'all', search = '', view = 'grid') {
  const menu = await loadMenuFromAPI();
  const cats = [...new Set(menu.map(i => i.category))].map((c, idx) => ({ id: c, name: c }));
  
  let items = [...menu];
  if (filterCat !== 'all') items = items.filter(i => i.category === filterCat);
  if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.desc||'').toLowerCase().includes(search.toLowerCase()));

  const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));

  const content = `
    <div class="section-header">
      <span class="section-title">Menu Management</span>
      <button class="btn btn-primary" onclick="openAddMenu()">+ Add Item</button>
    </div>

    <div class="filter-bar">
      <input class="search-input" id="menuSearch" placeholder="Search menu items…" value="${search}"
        oninput="renderMenu('${filterCat}', this.value, '${view}')">
      <select class="filter-select" id="catFilter" onchange="renderMenu(this.value, document.getElementById('menuSearch').value, '${view}')">
        <option value="all" ${filterCat==='all'?'selected':''}>All Categories</option>
        ${cats.map(c => `<option value="${c.id}" ${filterCat===c.id?'selected':''}>${c.name}</option>`).join('')}
      </select>
      <button class="btn btn-outline btn-sm" onclick="renderMenu('${filterCat}','${search}','${view==='grid'?'list':'grid'}')">
        ${view==='grid' ? '☰ List' : '⊞ Grid'}
      </button>
    </div>

    <div style="margin-bottom:8px;font-size:.82rem;color:var(--text-muted);">${items.length} item${items.length!==1?'s':''} found</div>

    ${view === 'grid'
      ? `<div class="menu-grid">${items.map(item => menuCard(item, catMap)).join('')}</div>`
      : `<div class="card"><div class="table-wrap">${menuTable(items, catMap)}</div></div>`
    }

    <!-- Add/Edit Modal -->
    <div class="modal-overlay" id="menuModal">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title" id="menuModalTitle">Add Menu Item</span>
          <button class="modal-close" onclick="closeModal('menuModal')">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Item Name *</label>
            <input class="form-control" id="mName" placeholder="e.g. Butter Chicken">
          </div>
          <div class="form-row">
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Category *</label>
              <input class="form-control" id="mCat" placeholder="e.g. Main Course">
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Price (₹) *</label>
              <input class="form-control" id="mPrice" type="number" min="0" placeholder="e.g. 250">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-control" id="mDesc" placeholder="Short description…"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Image (upload)</label>
              <div class="img-upload-box" id="imgUploadBox" onclick="document.getElementById('mImgFile').click()">
                <input type="file" id="mImgFile" accept="image/*" onchange="handleImgUpload(event)">
                <span id="imgPreview">📷 Click to upload</span>
              </div>
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Type</label>
              <div style="display:flex;gap:16px;margin-top:8px;">
                <label style="display:flex;align-items:center;gap:6px;font-size:.88rem;cursor:pointer;">
                  <input type="radio" name="mVeg" id="mVegY" value="true" checked style="accent-color:var(--success)"> 🟢 Veg
                </label>
                <label style="display:flex;align-items:center;gap:6px;font-size:.88rem;cursor:pointer;">
                  <input type="radio" name="mVeg" id="mVegN" value="false" style="accent-color:var(--danger)"> 🔴 Non-Veg
                </label>
              </div>
              <div class="toggle-wrap" style="margin-top:14px;">
                <button class="toggle on" id="mAvail" onclick="this.classList.toggle('on')"></button>
                <span class="toggle-label">Available</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModal('menuModal')">Cancel</button>
          <button class="btn btn-primary" onclick="saveMenu()">💾 Save Item</button>
        </div>
      </div>
    </div>`;

  buildPage('menu', 'Menu', content);
}

function menuCard(item, catMap) {
  return `
    <div class="menu-card" id="mc-${item.id}">
      <div class="menu-img">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;">` : '🍽️'}
      </div>
      <div class="menu-body">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <div class="veg-dot ${item.veg?'veg':'nonveg'}"></div>
          <div class="menu-name">${item.name}</div>
        </div>
        <div class="menu-desc">${item.desc || 'No description'}</div>
        <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:8px;">${catMap[item.category]||'—'}</div>
        <div class="menu-footer">
          <span class="menu-price">₹${item.price}</span>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px;">
          <button class="btn btn-sm btn-info" style="flex:1" onclick="editMenu(${item.id})">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" style="flex:1" onclick="deleteMenu(${item.id})">🗑️ Delete</button>
        </div>
      </div>
    </div>`;
}

function menuTable(items, catMap) {
  return `<table>
    <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Description</th><th>Actions</th></tr></thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${item.image ? `<img src="${item.image}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">` : '🍽️'}</td>
          <td><strong>${item.name}</strong></td>
          <td>${catMap[item.category]||'—'}</td>
          <td><strong>₹${item.price}</strong></td>
          <td><small style="color:var(--text-muted)">${item.desc?.slice(0,40)||''}</small></td>
          <td>
            <button class="btn btn-sm btn-info" onclick="editMenu(${item.id})">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteMenu(${item.id})">🗑️</button>
          </td>
        </tr>`).join('')}
    </tbody>
  </table>`;
}

function openAddMenu() {
  editingMenuId = null;
  window._editImgData = '';
  document.getElementById('menuModalTitle').textContent = 'Add Menu Item';
  ['mName','mDesc','mPrice','mCat'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('mVegY').checked = true;
  document.getElementById('mAvail').classList.add('on');
  document.getElementById('imgPreview').innerHTML = '📷 Click to upload';
  document.getElementById('mImgFile').value = '';
  openModal('menuModal');
}

function editMenu(id) {
  const item = _menuItems.find(i => i.id === id);
  if (!item) return;
  editingMenuId = id;
  window._editImgData = '';
  document.getElementById('menuModalTitle').textContent = 'Edit Menu Item';
  document.getElementById('mName').value = item.name;
  document.getElementById('mDesc').value = item.desc || '';
  document.getElementById('mPrice').value = item.price;
  document.getElementById('mCat').value = item.category;
  document.getElementById('mImgFile').value = '';

  // ✅ Show existing image in preview
  if (item.image) {
    document.getElementById('imgPreview').innerHTML = `<img src="${item.image}" style="max-height:90px;max-width:100%;border-radius:6px;">`;
  } else {
    document.getElementById('imgPreview').innerHTML = '📷 Click to upload';
  }

  openModal('menuModal');
}

function handleImgUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    window._editImgData = ev.target.result; // ✅ base64 image stored
    document.getElementById('imgPreview').innerHTML = `<img src="${ev.target.result}" style="max-height:90px;max-width:100%;border-radius:6px;">`;
  };
  reader.readAsDataURL(file);
}

async function saveMenu() {
  const name  = document.getElementById('mName').value.trim();
  const price = parseFloat(document.getElementById('mPrice').value);
  const cat   = document.getElementById('mCat').value.trim();
  const desc  = document.getElementById('mDesc').value.trim();
  const image = window._editImgData || ''; // ✅ base64 image

  if (!name || !price || !cat) { showToast('Please fill required fields', 'error'); return; }

  if (editingMenuId) {
    // ✅ Send image only if new one uploaded, otherwise keep existing
    const existingItem = _menuItems.find(i => i.id === editingMenuId);
    const finalImage = image || existingItem?.image || '';

    await fetch(`/editItem/${editingMenuId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price, category: cat, description: desc, image: finalImage })
    });
    showToast('Item updated!', 'success');
  } else {
    await fetch('/addItem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price, category: cat, description: desc, image }) // ✅ image included
    });
    showToast('Item added!', 'success');
  }

  closeModal('menuModal');
  renderMenu();
}

async function deleteMenu(id) {
  confirmDialog('Delete this menu item?', async () => {
    await fetch(`/deleteItem/${id}`, { method: 'DELETE' });
    showToast('Item deleted', 'warn');
    renderMenu();
  });
}