from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = os.environ.get("DB_PATH", "database.db")

app = Flask(__name__, static_folder="frontend", static_url_path="")
CORS(app, resources={r"/*": {"origins": "*"}})  # allow Netlify or any origin for hackathon


# ---------- Database ----------
def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with open("schema.sql", "r", encoding="utf-8") as f:
        schema = f.read()
    conn = get_db()
    conn.executescript(schema)
    conn.commit()
    conn.close()

# Initialize DB if first run
if not os.path.exists(DB_PATH):
    init_db()


# ---------- Health ----------
@app.get("/api")
def health():
    return jsonify({"ok": True, "service": "AgriMitra Flask API", "db": os.path.abspath(DB_PATH)})


# ---------- Auth ----------
@app.post("/signup")
def signup():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "").strip()  # farmer | buyer

    if not all([name, email, password, role]) or role not in ("farmer", "buyer"):
        return jsonify({"error": "Invalid payload"}), 400

    pwd_hash = generate_password_hash(password)
    conn = get_db()
    try:
        cur = conn.execute(
            "INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)",
            (name, email, pwd_hash, role),
        )
        conn.commit()
        user_id = cur.lastrowid
        return jsonify({
            "message": "Signup successful",
            "user": {"id": user_id, "name": name, "email": email, "role": role}
        })
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already registered"}), 409
    finally:
        conn.close()

@app.post("/login")
def login():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    conn = get_db()
    cur = conn.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cur.fetchone()
    conn.close()

    if user and check_password_hash(user["password_hash"], password):
        return jsonify({
            "message": "Login successful",
            "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}
        })
    return jsonify({"error": "Invalid credentials"}), 401


# ---------- Crops ----------
@app.post("/crops")
def add_crop():
    data = request.get_json(force=True)
    farmer_id = data.get("farmer_id")
    crop_name = (data.get("crop_name") or "").strip()
    quantity = data.get("quantity")
    price = data.get("price")
    image_url = data.get("image_url")  # optional

    if not all([farmer_id, crop_name, quantity, price]):
        return jsonify({"error": "Missing fields"}), 400

    conn = get_db()
    cur = conn.execute(
        "INSERT INTO crops (farmer_id, crop_name, quantity, price, image_url) VALUES (?,?,?,?,?)",
        (farmer_id, crop_name, quantity, price, image_url),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return jsonify({"message": "Crop added", "id": new_id})

@app.get("/crops")
def list_crops():
    farmer_id = request.args.get("farmer_id")
    q = request.args.get("q")
    min_price = request.args.get("min_price")
    max_price = request.args.get("max_price")

    sql = "SELECT c.*, u.name as farmer_name FROM crops c JOIN users u ON u.id=c.farmer_id WHERE 1=1"
    params = []
    if farmer_id:
        sql += " AND c.farmer_id = ?"
        params.append(farmer_id)
    if q:
        sql += " AND LOWER(c.crop_name) LIKE ?"
        params.append(f"%{q.lower()}%")
    if min_price:
        sql += " AND c.price >= ?"
        params.append(min_price)
    if max_price:
        sql += " AND c.price <= ?"
        params.append(max_price)

    conn = get_db()
    cur = conn.execute(sql, tuple(params))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

@app.delete("/crops/<int:crop_id>")
def delete_crop(crop_id):
    conn = get_db()
    conn.execute("DELETE FROM crops WHERE id = ?", (crop_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Crop deleted"})


# ---------- Orders / Bids ----------
@app.post("/orders")
def create_order():
    data = request.get_json(force=True)
    crop_id = data.get("crop_id")
    buyer_id = data.get("buyer_id")
    bid_price = data.get("bid_price")

    if not all([crop_id, buyer_id]):
        return jsonify({"error": "Missing fields"}), 400

    conn = get_db()
    cur = conn.execute(
        "INSERT INTO orders (crop_id,buyer_id,bid_price,status) VALUES (?,?,?,?)",
        (crop_id, buyer_id, bid_price, "pending"),
    )
    conn.commit()
    oid = cur.lastrowid
    conn.close()
    return jsonify({"message": "Order/Bid placed", "id": oid})

@app.get("/orders")
def list_orders():
    buyer_id = request.args.get("buyer_id")
    farmer_id = request.args.get("farmer_id")
    status = request.args.get("status")

    sql = """SELECT o.*, c.crop_name, c.farmer_id, u.name as buyer_name
             FROM orders o
             JOIN crops c ON c.id = o.crop_id
             JOIN users u ON u.id = o.buyer_id
             WHERE 1=1"""
    params = []
    if buyer_id:
        sql += " AND o.buyer_id = ?"
        params.append(buyer_id)
    if farmer_id:
        sql += " AND c.farmer_id = ?"
        params.append(farmer_id)
    if status:
        sql += " AND o.status = ?"
        params.append(status)

    conn = get_db()
    cur = conn.execute(sql, tuple(params))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

@app.patch("/orders/<int:order_id>")
def update_order_status(order_id):
    data = request.get_json(force=True)
    status = data.get("status")
    if status not in ("pending","accepted","rejected","bought"):
        return jsonify({"error": "Invalid status"}), 400

    conn = get_db()
    conn.execute("UPDATE orders SET status = ? WHERE id = ?", (status, order_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Order updated"})


# ---------- Equipment ----------
@app.post("/equipment")
def add_equipment():
    data = request.get_json(force=True)
    farmer_id = data.get("farmer_id")
    name = (data.get("name") or "").strip()
    rent_price = data.get("rent_price")
    if not all([farmer_id, name, rent_price]):
        return jsonify({"error": "Missing fields"}), 400

    conn = get_db()
    cur = conn.execute(
        "INSERT INTO equipment (farmer_id,name,rent_price,available) VALUES (?,?,?,1)",
        (farmer_id, name, rent_price),
    )
    conn.commit()
    eid = cur.lastrowid
    conn.close()
    return jsonify({"message": "Equipment listed", "id": eid})

@app.get("/equipment")
def list_equipment():
    available = request.args.get("available")
    farmer_id = request.args.get("farmer_id")

    sql = """SELECT e.*, u.name AS farmer_name
             FROM equipment e
             JOIN users u ON u.id=e.farmer_id
             WHERE 1=1"""
    params = []
    if available is not None:
        sql += " AND e.available = ?"
        params.append(available)
    if farmer_id:
        sql += " AND e.farmer_id = ?"
        params.append(farmer_id)

    conn = get_db()
    cur = conn.execute(sql, tuple(params))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

@app.delete("/equipment/<int:equip_id>")
def delete_equipment(equip_id):
    conn = get_db()
    conn.execute("DELETE FROM equipment WHERE id = ?", (equip_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Equipment deleted"})


# ---------- Rentals ----------
@app.post("/rentals")
def create_rental():
    data = request.get_json(force=True)
    equipment_id = data.get("equipment_id")
    user_id = data.get("user_id")
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    if not all([equipment_id, user_id, start_date, end_date]):
        return jsonify({"error": "Missing fields"}), 400

    conn = get_db()
    cur = conn.execute(
        "INSERT INTO rentals (equipment_id,user_id,start_date,end_date) VALUES (?,?,?,?)",
        (equipment_id, user_id, start_date, end_date),
    )
    conn.execute("UPDATE equipment SET available=0 WHERE id=?", (equipment_id,))
    conn.commit()
    rid = cur.lastrowid
    conn.close()
    return jsonify({"message": "Rental created", "id": rid})

@app.get("/rentals")
def list_rentals():
    user_id = request.args.get("user_id")
    sql = """SELECT r.*, e.name as equipment_name, u.name as renter_name
             FROM rentals r
             JOIN equipment e ON e.id=r.equipment_id
             JOIN users u ON u.id=r.user_id
             WHERE 1=1"""
    params = []
    if user_id:
        sql += " AND r.user_id = ?"
        params.append(user_id)

    conn = get_db()
    cur = conn.execute(sql, tuple(params))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)


# ---------- Frontend ----------
@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/farmer")
def serve_farmer():
    return send_from_directory(app.static_folder, "farmer.html")

@app.route("/buyer")
def serve_buyer():
    return send_from_directory(app.static_folder, "buyer.html")


# ---------- Run ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
