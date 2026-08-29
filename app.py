from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import bcrypt
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "restaurant.db")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
CUSTOMER_DIR = os.path.join(BASE_DIR, "frontend", "customer", "customer-website")
ADMIN_DIR = os.path.join(BASE_DIR, "frontend", "admin", "admin")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    try:
        conn.execute('ALTER TABLE menu_items ADD COLUMN image TEXT DEFAULT ""')
        conn.commit()
        print("✅ Image column added!")
    except:
        print("ℹ️ Image column already exists")
    try:
        conn.execute('ALTER TABLE orders ADD COLUMN table_number TEXT DEFAULT ""')
        conn.commit()
        print("✅ table_number column added!")
    except:
        print("ℹ️ table_number column already exists")
    try:
        conn.execute('ALTER TABLE orders ADD COLUMN customer_name TEXT DEFAULT ""')
        conn.execute('ALTER TABLE orders ADD COLUMN customer_phone TEXT DEFAULT ""')
        conn.commit()
        print("✅ customer_name/customer_phone columns added!")
    except:
        print("ℹ️ customer_name/customer_phone columns already exist")

    # ── New tables (previously localStorage-only dummy data) ──
    conn.execute('''CREATE TABLE IF NOT EXISTS tables (
        id TEXT PRIMARY KEY,
        number TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT "available"
    )''')
    for col_def in [('capacity', 'INTEGER DEFAULT 2'), ('status', 'TEXT DEFAULT "available"')]:
        try:
            conn.execute(f'ALTER TABLE tables ADD COLUMN {col_def[0]} {col_def[1]}')
            conn.commit()
        except:
            pass

    conn.execute('''CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT DEFAULT "",
        color TEXT DEFAULT ""
    )''')
    for col_def in [('icon', 'TEXT DEFAULT ""'), ('color', 'TEXT DEFAULT ""')]:
        try:
            conn.execute(f'ALTER TABLE categories ADD COLUMN {col_def[0]} {col_def[1]}')
            conn.commit()
        except:
            pass

    conn.execute('''CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT DEFAULT "",
        email TEXT DEFAULT "",
        visits INTEGER DEFAULT 0,
        total_spend REAL DEFAULT 0,
        joined TEXT DEFAULT ""
    )''')
    # Safety: agar 'customers' table purane/adhure schema se pehle se ban chuki thi,
    # to yahan missing columns explicitly add karo
    for col_def in [
        ('email', 'TEXT DEFAULT ""'),
        ('phone', 'TEXT DEFAULT ""'),
        ('visits', 'INTEGER DEFAULT 0'),
        ('total_spend', 'REAL DEFAULT 0'),
        ('joined', 'TEXT DEFAULT ""')
    ]:
        try:
            conn.execute(f'ALTER TABLE customers ADD COLUMN {col_def[0]} {col_def[1]}')
            conn.commit()
            print(f"✅ customers.{col_def[0]} column added!")
        except:
            pass  # column already exists — ignore

    # ── Safe one-time repair: agar 'id' column kabhi INTEGER type mein ban gaya tha
    # (kisi bahut purani attempt se), to use TEXT mein migrate karo bina data khoye ──
    try:
        info_cursor = conn.cursor()
        info_cursor.execute("PRAGMA table_info(customers)")
        cols_info = info_cursor.fetchall()
        id_col = next((c for c in cols_info if c["name"] == "id"), None)
        if id_col and id_col["type"].upper() != "TEXT":
            conn.execute("ALTER TABLE customers RENAME TO customers_legacy_backup")
            conn.commit()
            conn.execute('''CREATE TABLE customers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT DEFAULT "",
                email TEXT DEFAULT "",
                visits INTEGER DEFAULT 0,
                total_spend REAL DEFAULT 0,
                joined TEXT DEFAULT ""
            )''')
            try:
                conn.execute('''INSERT INTO customers (id, name, phone, email, visits, total_spend, joined)
                    SELECT 'c' || CAST(id AS TEXT), name,
                           IFNULL(phone, ''), IFNULL(email, ''),
                           IFNULL(visits, 0), IFNULL(total_spend, 0), IFNULL(joined, '')
                    FROM customers_legacy_backup''')
                conn.commit()
            except Exception as mig_err:
                print("ℹ️ No old customer rows to migrate:", mig_err)
            print("✅ Fixed customers.id column type (was not TEXT) — old data safely migrated")
    except Exception as e:
        print("⚠️ Customer table id-type check skipped:", e)

    conn.execute('''CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        discount REAL NOT NULL,
        type TEXT NOT NULL DEFAULT "percent",
        expiry TEXT DEFAULT "",
        active INTEGER DEFAULT 1,
        usage_count INTEGER DEFAULT 0
    )''')
    for col_def in [
        ('type', 'TEXT DEFAULT "percent"'), ('expiry', 'TEXT DEFAULT ""'),
        ('active', 'INTEGER DEFAULT 1'), ('usage_count', 'INTEGER DEFAULT 0')
    ]:
        try:
            conn.execute(f'ALTER TABLE coupons ADD COLUMN {col_def[0]} {col_def[1]}')
            conn.commit()
        except:
            pass

    conn.execute('''CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT DEFAULT "My Restaurant",
        address TEXT DEFAULT "",
        phone TEXT DEFAULT "",
        gst TEXT DEFAULT "",
        logo TEXT DEFAULT "",
        open_time TEXT DEFAULT "10:00",
        close_time TEXT DEFAULT "23:00",
        currency TEXT DEFAULT "₹"
    )''')
    for col_def in [
        ('address', 'TEXT DEFAULT ""'), ('phone', 'TEXT DEFAULT ""'), ('gst', 'TEXT DEFAULT ""'),
        ('logo', 'TEXT DEFAULT ""'), ('open_time', 'TEXT DEFAULT "10:00"'),
        ('close_time', 'TEXT DEFAULT "23:00"'), ('currency', 'TEXT DEFAULT "₹"')
    ]:
        try:
            conn.execute(f'ALTER TABLE settings ADD COLUMN {col_def[0]} {col_def[1]}')
            conn.commit()
        except:
            pass
    # Ensure exactly one settings row always exists
    conn.execute('INSERT OR IGNORE INTO settings (id) VALUES (1)')

    conn.commit()
    conn.close()

def uid():
    import uuid
    return uuid.uuid4().hex[:8]

@app.route("/")
def home_page():
    return send_from_directory(CUSTOMER_DIR, "index.html")

@app.route("/index.html")
def index_html():
    return send_from_directory(CUSTOMER_DIR, "index.html")

@app.route("/menu/")
@app.route("/menu/<path:subpath>")
def menu_page_with_slash(subpath=None):
    return send_from_directory(CUSTOMER_DIR, "menu.html")

@app.route("/menu.html")
def menu_page():
    return send_from_directory(CUSTOMER_DIR, "menu.html")

@app.route("/cart.html")
def cart_page():
    return send_from_directory(CUSTOMER_DIR, "cart.html")

@app.route("/checkout.html")
def checkout_page():
    return send_from_directory(CUSTOMER_DIR, "checkout.html")

@app.route("/feedback.html")
def feedback_page():
    return send_from_directory(CUSTOMER_DIR, "feedback.html")

@app.route("/status.html")
def status_page():
    return send_from_directory(CUSTOMER_DIR, "status.html")

@app.route("/success.html")
def success_page():
    return send_from_directory(CUSTOMER_DIR, "success.html")

@app.route("/css/<path:path>")
def serve_css(path):
    return send_from_directory(os.path.join(CUSTOMER_DIR, "css"), path)

@app.route("/js/<path:path>")
def serve_js(path):
    return send_from_directory(os.path.join(CUSTOMER_DIR, "js"), path)

@app.route("/data/<path:path>")
def serve_data(path):
    return send_from_directory(os.path.join(CUSTOMER_DIR, "data"), path)

@app.route("/admin")
@app.route("/admin/")
def admin_login_page():
    return send_from_directory(ADMIN_DIR, "login.html")

@app.route("/admin/dashboard")
def admin_dashboard():
    return send_from_directory(ADMIN_DIR, "dashboard.html")

@app.route("/admin/orders")
def admin_orders():
    return send_from_directory(ADMIN_DIR, "orders.html")

@app.route("/admin/menu")
def admin_menu():
    return send_from_directory(ADMIN_DIR, "menu.html")

@app.route("/admin/categories")
def admin_categories():
    return send_from_directory(ADMIN_DIR, "categories.html")

@app.route("/admin/tables")
def admin_tables():
    return send_from_directory(ADMIN_DIR, "tables.html")

@app.route("/admin/offers")
def admin_offers():
    return send_from_directory(ADMIN_DIR, "offers.html")

@app.route("/admin/customers")
def admin_customers():
    return send_from_directory(ADMIN_DIR, "customers.html")

@app.route("/admin/payments")
def admin_payments():
    return send_from_directory(ADMIN_DIR, "payments.html")

@app.route("/admin/settings")
def admin_settings():
    return send_from_directory(ADMIN_DIR, "settings.html")

@app.route("/admin/<path:path>")
def serve_admin_files(path):
    return send_from_directory(ADMIN_DIR, path)

@app.route("/images/<path:path>")
def serve_images(path):
    return send_from_directory(os.path.join(FRONTEND_DIR, "images"), path)

@app.route("/login", methods=["POST"])
def admin_login():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"success": False, "message": "Username and password required"}), 400
    username = data["username"]
    password = data["password"]
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM admin_users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    if user is None:
        return jsonify({"success": False, "message": "Invalid username or password"}), 401
    stored_hash = user["password"]
    if stored_hash.startswith("$2b$"):
        if bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
            return jsonify({"success": True, "admin": username})
    else:
        if password == stored_hash:
            return jsonify({"success": True, "admin": username})
    return jsonify({"success": False, "message": "Invalid username or password"}), 401

@app.route("/getMenu", methods=["GET"])
def get_menu():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM menu_items ORDER BY category, name")
    rows = cursor.fetchall()
    conn.close()
    menu = {}
    for row in rows:
        category = row["category"]
        if category not in menu:
            menu[category] = []
        menu[category].append({
            "id": row["id"],
            "name": row["name"],
            "price": float(row["price"]),
            "description": row["description"] or "",
            "image": row["image"] or ""
        })
    return jsonify({"success": True, "menu": menu})

@app.route("/addItem", methods=["POST"])
def add_item():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO menu_items (name, category, price, description, image) VALUES (?, ?, ?, ?, ?)",
        (data["name"], data["category"], data["price"], data.get("description", ""), data.get("image", ""))
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/editItem/<int:item_id>", methods=["PUT"])
def edit_item(item_id):
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    fields = []
    values = []
    for key in ["name", "category", "price", "description", "image"]:
        if key in data:
            fields.append(f"{key}=?")
            values.append(data[key])
    values.append(item_id)
    query = f"UPDATE menu_items SET {', '.join(fields)} WHERE id=?"
    cursor.execute(query, values)
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/deleteItem/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM menu_items WHERE id=?", (item_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/place-order", methods=["POST"])
def place_order():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    try:
        customer_name = data.get("customerName", "")
        customer_phone = data.get("customerPhone", "")
        total = data.get("total")

        cursor.execute(
            "INSERT INTO orders (table_number, items, total, status, created_at, customer_name, customer_phone) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                data.get("table"),
                json.dumps(data.get("items")),
                total,
                "Pending",
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                customer_name,
                customer_phone
            )
        )
        conn.commit()
        order_id = cursor.lastrowid

        # ── Auto-create/update customer record from real order data ──
        # Isse alag try/except mein rakha hai taaki customer-tracking mein
        # koi bhi issue ho, order place hona kabhi na ruke (order already committed upar)
        if customer_phone:
            try:
                cursor.execute("SELECT * FROM customers WHERE phone=?", (customer_phone,))
                existing = cursor.fetchone()
                if existing:
                    cursor.execute(
                        "UPDATE customers SET visits = visits + 1, total_spend = total_spend + ?, name = ? WHERE phone=?",
                        (float(total or 0), customer_name or existing["name"], customer_phone)
                    )
                else:
                    cursor.execute(
                        "INSERT INTO customers (id, name, phone, email, visits, total_spend, joined) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        ("c" + uid(), customer_name, customer_phone, "", 1, float(total or 0), datetime.now().strftime("%Y-%m-%d"))
                    )
                conn.commit()
            except Exception as ce:
                print("⚠️ Customer tracking error (order still placed fine):", ce)

        conn.close()
        return jsonify({"success": True, "orderId": order_id})
    except Exception as e:
        conn.close()
        print("❌ Order error:", e)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/getOrders", methods=["GET"])
def get_orders():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    orders = []
    for row in rows:
        orders.append({
            "id": row["id"],
            "table": row["table_number"],
            "items": json.loads(row["items"]),
            "total": row["total"],
            "status": row["status"],
            "time": row["created_at"],
            "customerName": row["customer_name"] if "customer_name" in row.keys() else "",
            "customerPhone": row["customer_phone"] if "customer_phone" in row.keys() else ""
        })
    return jsonify({"success": True, "orders": orders})

@app.route("/updateOrderStatus/<int:order_id>", methods=["PUT"])
def update_order_status(order_id):
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE orders SET status=? WHERE id=?", (data.get("status"), order_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/deleteAllOrders", methods=["DELETE"])
def delete_all_orders():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM orders")
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Order history cleared"})


# ============================================================
# TABLES — real backend CRUD (replaces localStorage rq_tables)
# ============================================================
@app.route("/getTables", methods=["GET"])
def get_tables():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tables ORDER BY number")
    rows = cursor.fetchall()
    conn.close()
    tables = [{"id": r["id"], "number": r["number"], "capacity": r["capacity"], "status": r["status"]} for r in rows]
    return jsonify({"success": True, "tables": tables})

@app.route("/addTable", methods=["POST"])
def add_table():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    new_id = "T" + uid()
    cursor.execute(
        "INSERT INTO tables (id, number, capacity, status) VALUES (?, ?, ?, ?)",
        (new_id, data["number"], data["capacity"], data.get("status", "available"))
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "id": new_id})

@app.route("/editTable/<table_id>", methods=["PUT"])
def edit_table(table_id):
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    fields, values = [], []
    for key in ["number", "capacity", "status"]:
        if key in data:
            fields.append(f"{key}=?")
            values.append(data[key])
    values.append(table_id)
    cursor.execute(f"UPDATE tables SET {', '.join(fields)} WHERE id=?", values)
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/deleteTable/<table_id>", methods=["DELETE"])
def delete_table(table_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tables WHERE id=?", (table_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# ============================================================
# CATEGORIES — real backend CRUD (replaces localStorage rq_categories)
# ============================================================
@app.route("/getCategories", methods=["GET"])
def get_categories():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories ORDER BY name")
    rows = cursor.fetchall()
    conn.close()
    cats = [{"id": r["id"], "name": r["name"], "icon": r["icon"], "color": r["color"]} for r in rows]
    return jsonify({"success": True, "categories": cats})

@app.route("/addCategory", methods=["POST"])
def add_category():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    new_id = "cat" + uid()
    cursor.execute(
        "INSERT INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)",
        (new_id, data["name"], data.get("icon", ""), data.get("color", ""))
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "id": new_id})

@app.route("/editCategory/<cat_id>", methods=["PUT"])
def edit_category(cat_id):
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    fields, values = [], []
    for key in ["name", "icon", "color"]:
        if key in data:
            fields.append(f"{key}=?")
            values.append(data[key])
    values.append(cat_id)
    cursor.execute(f"UPDATE categories SET {', '.join(fields)} WHERE id=?", values)
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/deleteCategory/<cat_id>", methods=["DELETE"])
def delete_category(cat_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM categories WHERE id=?", (cat_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# ============================================================
# CUSTOMERS — real backend CRUD (replaces localStorage rq_customers)
# ============================================================
@app.route("/getCustomers", methods=["GET"])
def get_customers():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers ORDER BY name")
    rows = cursor.fetchall()
    conn.close()
    customers = [{
        "id": r["id"], "name": r["name"], "phone": r["phone"], "email": r["email"],
        "visits": r["visits"], "totalSpend": r["total_spend"], "joined": r["joined"]
    } for r in rows]
    return jsonify({"success": True, "customers": customers})

@app.route("/addCustomer", methods=["POST"])
def add_customer():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    new_id = "c" + uid()
    cursor.execute(
        "INSERT INTO customers (id, name, phone, email, visits, total_spend, joined) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (new_id, data["name"], data.get("phone", ""), data.get("email", ""),
         data.get("visits", 0), data.get("totalSpend", 0), data.get("joined", datetime.now().strftime("%Y-%m-%d")))
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "id": new_id})

@app.route("/editCustomer/<cust_id>", methods=["PUT"])
def edit_customer(cust_id):
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    fields, values = [], []
    field_map = {"name": "name", "phone": "phone", "email": "email", "visits": "visits", "totalSpend": "total_spend", "joined": "joined"}
    for key, col in field_map.items():
        if key in data:
            fields.append(f"{col}=?")
            values.append(data[key])
    values.append(cust_id)
    cursor.execute(f"UPDATE customers SET {', '.join(fields)} WHERE id=?", values)
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/deleteCustomer/<cust_id>", methods=["DELETE"])
def delete_customer(cust_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM customers WHERE id=?", (cust_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# ============================================================
# COUPONS — real backend CRUD (replaces localStorage rq_coupons)
# ============================================================
@app.route("/getCoupons", methods=["GET"])
def get_coupons():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM coupons ORDER BY code")
    rows = cursor.fetchall()
    conn.close()
    coupons = [{
        "id": r["id"], "code": r["code"], "discount": r["discount"], "type": r["type"],
        "expiry": r["expiry"], "active": bool(r["active"]), "usageCount": r["usage_count"]
    } for r in rows]
    return jsonify({"success": True, "coupons": coupons})

@app.route("/addCoupon", methods=["POST"])
def add_coupon():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    new_id = "cp" + uid()
    cursor.execute(
        "INSERT INTO coupons (id, code, discount, type, expiry, active, usage_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (new_id, data["code"], data["discount"], data.get("type", "percent"),
         data.get("expiry", ""), int(data.get("active", True)), data.get("usageCount", 0))
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "id": new_id})

@app.route("/editCoupon/<coupon_id>", methods=["PUT"])
def edit_coupon(coupon_id):
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    fields, values = [], []
    field_map = {"code": "code", "discount": "discount", "type": "type", "expiry": "expiry", "active": "active", "usageCount": "usage_count"}
    for key, col in field_map.items():
        if key in data:
            fields.append(f"{col}=?")
            values.append(int(data[key]) if key == "active" else data[key])
    values.append(coupon_id)
    cursor.execute(f"UPDATE coupons SET {', '.join(fields)} WHERE id=?", values)
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/deleteCoupon/<coupon_id>", methods=["DELETE"])
def delete_coupon(coupon_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM coupons WHERE id=?", (coupon_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# ============================================================
# SETTINGS — real backend (replaces localStorage rq_settings)
# Single row (id=1), also fixes the old "/getSettings 404" bug
# ============================================================
@app.route("/getSettings", methods=["GET"])
def get_settings():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM settings WHERE id=1")
    r = cursor.fetchone()
    conn.close()
    settings = {
        "name": r["name"], "address": r["address"], "phone": r["phone"], "gst": r["gst"],
        "logo": r["logo"], "openTime": r["open_time"], "closeTime": r["close_time"], "currency": r["currency"]
    }
    return jsonify({"success": True, "settings": settings})

@app.route("/saveSettings", methods=["PUT", "POST"])
def save_settings():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    fields, values = [], []
    field_map = {"name": "name", "address": "address", "phone": "phone", "gst": "gst",
                 "logo": "logo", "openTime": "open_time", "closeTime": "close_time", "currency": "currency"}
    for key, col in field_map.items():
        if key in data:
            fields.append(f"{col}=?")
            values.append(data[key])
    cursor.execute(f"UPDATE settings SET {', '.join(fields)} WHERE id=1", values)
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# 👇 FIX: Yahan module-level pe call kiya, taaki Gunicorn se import hone par
# bhi ye chale (pehle sirf "python app.py" se direct run karne par chalta tha)
init_db()

@app.route("/getAdminUsername", methods=["GET"])
def get_admin_username():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM admin_users LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    return jsonify({"success": True, "username": row["username"] if row else ""})

@app.route("/changeAdminPassword", methods=["PUT"])
def change_admin_password():
    data = request.get_json()
    username = data.get("username")
    current_password = data.get("currentPassword", "")
    new_password = data.get("newPassword", "")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM admin_users WHERE username=?", (username,))
    user = cursor.fetchone()
    if user is None:
        conn.close()
        return jsonify({"success": False, "message": "Admin not found"}), 404
    stored_hash = user["password"]
    valid = False
    if stored_hash.startswith("$2b$"):
        valid = bcrypt.checkpw(current_password.encode("utf-8"), stored_hash.encode("utf-8"))
    else:
        valid = (current_password == stored_hash)
    if not valid:
        conn.close()
        return jsonify({"success": False, "message": "Current password is incorrect"}), 401
    new_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    cursor.execute("UPDATE admin_users SET password=? WHERE username=?", (new_hash, username))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/changeAdminId", methods=["PUT"])
def change_admin_id():
    data = request.get_json()
    old_username = data.get("oldUsername")
    new_username = data.get("newUsername")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM admin_users WHERE username=?", (old_username,))
    user = cursor.fetchone()
    if user is None:
        conn.close()
        return jsonify({"success": False, "message": "Admin not found"}), 404
    try:
        cursor.execute("UPDATE admin_users SET username=? WHERE username=?", (new_username, old_username))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": str(e)}), 400
    conn.close()
    return jsonify({"success": True})


@app.route("/resetAdminCredentials", methods=["POST"])
def reset_admin_credentials():
    # ⚠️ Temporary/one-time use route — real admin_users row ko 'admin'/'admin123'
    # (bcrypt-hashed) pe set/reset kar deta hai, taaki hardcoded fallback hatane
    # ke baad lockout na ho. Isse use karne ke baad Settings page se turant
    # asli password change kar lena, aur phir chaho to ye route hata dena.
    conn = get_db()
    cursor = conn.cursor()
    hashed = bcrypt.hashpw("admin123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    cursor.execute("SELECT * FROM admin_users LIMIT 1")
    existing = cursor.fetchone()
    if existing:
        cursor.execute("UPDATE admin_users SET username=?, password=? WHERE username=?", ("admin", hashed, existing["username"]))
    else:
        cursor.execute("INSERT INTO admin_users (username, password) VALUES (?, ?)", ("admin", hashed))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Admin credentials reset to admin/admin123"})


if __name__ == "__main__":
    print("🔥 Server running on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
