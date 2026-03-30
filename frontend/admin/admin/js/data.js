
// ============================================================
// data.js — Seed & manage all localStorage dummy data
// ============================================================

const DB = {
  init() {
    if (!localStorage.getItem('rq_initialized')) {
      this.seed();
      localStorage.setItem('rq_initialized', 'true');
    }
  },

  seed() {
    // Admin credentials
    if (!localStorage.getItem('rq_admin')) {
      localStorage.setItem('rq_admin', JSON.stringify({ id: 'admin', password: 'admin123' }));
    }

    // Restaurant settings
    localStorage.setItem('rq_settings', JSON.stringify({
      name: 'Spice Garden Restaurant',
      address: '12, MG Road, Nagpur, Maharashtra - 440001',
      phone: '+91 98765 43210',
      gst: '27AABCU9603R1ZX',
      logo: '',
      openTime: '10:00',
      closeTime: '23:00',
      currency: '₹'
    }));

    // Categories
    localStorage.setItem('rq_categories', JSON.stringify([
      { id: 'cat1', name: 'Starters', icon: '🥗', color: '#e8f5e9' },
      { id: 'cat2', name: 'Main Course', icon: '🍛', color: '#fff3e0' },
      { id: 'cat3', name: 'Breads', icon: '🫓', color: '#fce4ec' },
      { id: 'cat4', name: 'Beverages', icon: '🥤', color: '#e3f2fd' },
      { id: 'cat5', name: 'Desserts', icon: '🍮', color: '#f3e5f5' },
      { id: 'cat6', name: 'Rice & Biryani', icon: '🍚', color: '#fffde7' }
    ]));

    // Menu items
    localStorage.setItem('rq_menu', JSON.stringify([
      { id: 'm1', name: 'Paneer Tikka', category: 'cat1', price: 220, desc: 'Grilled cottage cheese with spices', available: true, image: '', veg: true },
      { id: 'm2', name: 'Chicken 65', category: 'cat1', price: 280, desc: 'Crispy fried chicken with curry leaves', available: true, image: '', veg: false },
      { id: 'm3', name: 'Veg Spring Roll', category: 'cat1', price: 150, desc: 'Crispy rolls filled with fresh veggies', available: true, image: '', veg: true },
      { id: 'm4', name: 'Butter Chicken', category: 'cat2', price: 340, desc: 'Tender chicken in rich buttery tomato gravy', available: true, image: '', veg: false },
      { id: 'm5', name: 'Paneer Butter Masala', category: 'cat2', price: 300, desc: 'Cottage cheese in creamy tomato sauce', available: true, image: '', veg: true },
      { id: 'm6', name: 'Dal Makhani', category: 'cat2', price: 220, desc: 'Slow-cooked black lentils with cream', available: true, image: '', veg: true },
      { id: 'm7', name: 'Palak Paneer', category: 'cat2', price: 260, desc: 'Spinach and cottage cheese curry', available: false, image: '', veg: true },
      { id: 'm8', name: 'Butter Naan', category: 'cat3', price: 50, desc: 'Soft leavened bread with butter', available: true, image: '', veg: true },
      { id: 'm9', name: 'Tandoori Roti', category: 'cat3', price: 30, desc: 'Whole wheat bread from tandoor', available: true, image: '', veg: true },
      { id: 'm10', name: 'Garlic Naan', category: 'cat3', price: 60, desc: 'Naan topped with garlic and butter', available: true, image: '', veg: true },
      { id: 'm11', name: 'Mango Lassi', category: 'cat4', price: 120, desc: 'Refreshing yogurt drink with mango', available: true, image: '', veg: true },
      { id: 'm12', name: 'Masala Chai', category: 'cat4', price: 60, desc: 'Traditional spiced Indian tea', available: true, image: '', veg: true },
      { id: 'm13', name: 'Cold Coffee', category: 'cat4', price: 140, desc: 'Chilled coffee with ice cream', available: true, image: '', veg: true },
      { id: 'm14', name: 'Gulab Jamun', category: 'cat5', price: 100, desc: 'Soft milk dumplings in sugar syrup', available: true, image: '', veg: true },
      { id: 'm15', name: 'Rasgulla', category: 'cat5', price: 90, desc: 'Spongy cottage cheese balls in syrup', available: true, image: '', veg: true },
      { id: 'm16', name: 'Chicken Biryani', category: 'cat6', price: 380, desc: 'Fragrant basmati rice with spiced chicken', available: true, image: '', veg: false },
      { id: 'm17', name: 'Veg Biryani', category: 'cat6', price: 280, desc: 'Aromatic rice with mixed vegetables', available: true, image: '', veg: true },
    ]));

    // Tables
    localStorage.setItem('rq_tables', JSON.stringify([
      { id: 'T1', number: '01', capacity: 2, status: 'available' },
      { id: 'T2', number: '02', capacity: 4, status: 'occupied' },
      { id: 'T3', number: '03', capacity: 4, status: 'available' },
      { id: 'T4', number: '04', capacity: 6, status: 'reserved' },
      { id: 'T5', number: '05', capacity: 2, status: 'available' },
      { id: 'T6', number: '06', capacity: 8, status: 'occupied' },
      { id: 'T7', number: '07', capacity: 4, status: 'available' },
      { id: 'T8', number: '08', capacity: 6, status: 'available' },
    ]));

    // Customers
    localStorage.setItem('rq_customers', JSON.stringify([
      { id: 'c1', name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@email.com', visits: 8, totalSpend: 3420, joined: '2024-01-15' },
      { id: 'c2', name: 'Priya Patel', phone: '9765432109', email: 'priya@email.com', visits: 5, totalSpend: 2100, joined: '2024-02-20' },
      { id: 'c3', name: 'Amit Kumar', phone: '9654321098', email: 'amit@email.com', visits: 12, totalSpend: 5600, joined: '2023-11-10' },
      { id: 'c4', name: 'Sneha Joshi', phone: '9543210987', email: 'sneha@email.com', visits: 3, totalSpend: 980, joined: '2024-03-05' },
      { id: 'c5', name: 'Vikram Singh', phone: '9432109876', email: 'vikram@email.com', visits: 7, totalSpend: 2850, joined: '2024-01-28' },
      { id: 'c6', name: 'Neha Gupta', phone: '9321098765', email: 'neha@email.com', visits: 2, totalSpend: 740, joined: '2024-04-12' },
    ]));

    // Coupons
    localStorage.setItem('rq_coupons', JSON.stringify([
      { id: 'cp1', code: 'WELCOME20', discount: 20, type: 'percent', expiry: '2025-12-31', active: true, usageCount: 45 },
      { id: 'cp2', code: 'FLAT100', discount: 100, type: 'flat', expiry: '2025-06-30', active: true, usageCount: 12 },
      { id: 'cp3', code: 'DIWALI30', discount: 30, type: 'percent', expiry: '2024-11-15', active: false, usageCount: 89 },
      { id: 'cp4', code: 'SUMMER15', discount: 15, type: 'percent', expiry: '2025-09-30', active: true, usageCount: 23 },
    ]));

    // Orders
    const now = new Date();
    const orders = [];
    const statuses = ['pending', 'preparing', 'ready', 'completed', 'rejected'];
    const payMethods = ['Cash', 'UPI', 'Card'];
    const itemSets = [
      [{ id: 'm4', name: 'Butter Chicken', price: 340, qty: 1 }, { id: 'm8', name: 'Butter Naan', price: 50, qty: 3 }, { id: 'm11', name: 'Mango Lassi', price: 120, qty: 2 }],
      [{ id: 'm1', name: 'Paneer Tikka', price: 220, qty: 1 }, { id: 'm5', name: 'Paneer Butter Masala', price: 300, qty: 1 }, { id: 'm9', name: 'Tandoori Roti', price: 30, qty: 4 }],
      [{ id: 'm16', name: 'Chicken Biryani', price: 380, qty: 2 }, { id: 'm12', name: 'Masala Chai', price: 60, qty: 2 }, { id: 'm14', name: 'Gulab Jamun', price: 100, qty: 2 }],
      [{ id: 'm6', name: 'Dal Makhani', price: 220, qty: 1 }, { id: 'm17', name: 'Veg Biryani', price: 280, qty: 1 }, { id: 'm10', name: 'Garlic Naan', price: 60, qty: 2 }],
      [{ id: 'm2', name: 'Chicken 65', price: 280, qty: 1 }, { id: 'm4', name: 'Butter Chicken', price: 340, qty: 1 }, { id: 'm13', name: 'Cold Coffee', price: 140, qty: 2 }],
    ];
    const customers = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Joshi', 'Vikram Singh', 'Walk-in Customer'];
    const tables = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];

    for (let i = 1; i <= 18; i++) {
      const items = itemSets[(i - 1) % itemSets.length];
      const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
      const tax = Math.round(subtotal * 0.05);
      const discount = i % 4 === 0 ? Math.round(subtotal * 0.1) : 0;
      const total = subtotal + tax - discount;
      const status = i <= 3 ? 'pending' : i <= 6 ? 'preparing' : i <= 8 ? 'ready' : i <= 15 ? 'completed' : 'rejected';
      const d = new Date(now);
      d.setDate(d.getDate() - Math.floor((i - 1) / 3));
      d.setHours(12 + (i % 8), i % 60);
      orders.push({
        id: `ORD${String(i).padStart(4, '0')}`,
        table: tables[i % tables.length],
        customer: customers[i % customers.length],
        items,
        subtotal,
        tax,
        discount,
        total,
        status,
        payMethod: payMethods[i % payMethods.length],
        paid: status === 'completed',
        coupon: i % 4 === 0 ? 'WELCOME20' : '',
        time: d.toISOString(),
        notes: i % 5 === 0 ? 'Extra spicy please' : ''
      });
    }
    localStorage.setItem('rq_orders', JSON.stringify(orders));

    // Transactions
    const txns = orders.filter(o => o.paid).map((o, idx) => ({
      id: `TXN${String(idx + 1).padStart(4, '0')}`,
      orderId: o.id,
      amount: o.total,
      method: o.payMethod,
      time: o.time,
      customer: o.customer,
      table: o.table
    }));
    localStorage.setItem('rq_transactions', JSON.stringify(txns));
  },

  get(key) {
    try { return JSON.parse(localStorage.getItem('rq_' + key)) || []; }
    catch { return []; }
  },

  set(key, value) {
    localStorage.setItem('rq_' + key, JSON.stringify(value));
  },

  getOne(key) {
    try { return JSON.parse(localStorage.getItem('rq_' + key)) || {}; }
    catch { return {}; }
  }
};

// Auto-init on load
DB.init();
