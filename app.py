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
    conn.close()

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
        cursor.execute(
            "INSERT INTO orders (table_number, items, total, status, created_at) VALUES (?, ?, ?, ?, ?)",
            (
                data.get("table"),
                json.dumps(data.get("items")),
                data.get("total"),
                "Pending",
                datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
        )
        conn.commit()
        order_id = cursor.lastrowid
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
            "time": row["created_at"]
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

if __name__ == "__main__":
    init_db()
    print("🔥 Server running on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
