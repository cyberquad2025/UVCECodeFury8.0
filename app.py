from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from pathlib import Path
import datetime

DB_PATH = os.environ.get("DB_PATH", "database.db")
FRONTEND_DIR = "frontend"
UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app, resources={r"/*": {"origins": "*"}})
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ---------- Database helpers ----------
def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    schema_path = Path("schema.sql")
    conn = get_db()
    if schema_path.exists():
        with open(schema_path, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
    conn.commit()
    conn.close()

if not os.path.exists(DB_PATH):
    init_db()
else:
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
    role = (data.get("role") or "").strip()
    if not all([name, email, password, role]) or role not in ("farmer", "buyer"):
        return jsonify({"error": "Invalid payload"}), 400
    pwd_hash = generate_password_hash(password)
    conn = get_db()
    try:
        cur = conn.execute(
            "INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)",
            (name, email, pwd_hash, role)
        )
        conn.commit()
        user_id = cur.lastrowid
        return jsonify({"message": "Signup successful",
                        "user": {"id": user_id, "name": name, "email": email, "role": role}})
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
    farmer_id = request.form.get("farmer_id")
    crop_name = (request.form.get("crop_name") or "").strip()
    quantity = request.form.get("quantity")
    price = request.form.get("price")
    image = request.files.get("image")

    if not all([farmer_id, crop_name, quantity, price]):
        return jsonify({"error": "Missing fields"}), 400

    image_url = None
    if image:
        filename = f"{int(datetime.datetime.utcnow().timestamp())}_{secure_filename(image.filename)}"
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        image.save(filepath)
        image_url = f"{UPLOAD_FOLDER}/{filename}"

    conn = get_db()
    cur = conn.execute(
        "INSERT INTO crops (farmer_id, crop_name, quantity, price, image_url) VALUES (?,?,?,?,?)",
        (farmer_id, crop_name, quantity, price, image_url)
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return jsonify({"message": "Crop added successfully", "id": new_id, "image_url": image_url})

@app.get("/crops")
def list_crops():
    conn = get_db()
    sql = """
    SELECT c.*, u.name as farmer_name
    FROM crops c
    JOIN users u ON u.id=c.farmer_id
    """
    cur = conn.execute(sql)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

# ---------- Orders ----------
@app.post("/orders")
def create_order():
    data = request.get_json(force=True)
    buyer_id = data.get("buyer_id")
    crop_id = data.get("crop_id")
    bid_price = data.get("price")
    if not all([buyer_id, crop_id, bid_price]):
        return jsonify({"error": "Missing fields"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO orders (buyer_id, crop_id, bid_price) VALUES (?,?,?)",
        (buyer_id, crop_id, bid_price)
    )
    conn.commit()
    order_id = cur.lastrowid
    conn.close()
    return jsonify({"id": order_id, "message": "Order placed successfully"}), 201

@app.get("/orders")
def list_orders():
    buyer_id = request.args.get("buyer_id", type=int)
    conn = get_db()
    sql = """
    SELECT o.id, o.buyer_id, o.crop_id, o.bid_price as price, o.status, c.crop_name
    FROM orders o
    JOIN crops c ON c.id=o.crop_id
    """
    params = []
    if buyer_id:
        sql += " WHERE o.buyer_id = ?"
        params.append(buyer_id)
    cur = conn.execute(sql, tuple(params))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

# ---------- Equipment ----------
@app.post("/equipment")
def add_equipment():
    farmer_id = request.form.get("farmer_id")
    name = (request.form.get("name") or "").strip()
    rent_price = request.form.get("rent_price")
    if not all([farmer_id, name, rent_price]):
        return jsonify({"error": "Missing fields"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO equipment (farmer_id,name,rent_price) VALUES (?,?,?)",
        (farmer_id,name,rent_price)
    )
    conn.commit()
    equip_id = cur.lastrowid
    conn.close()
    return jsonify({"id": equip_id, "message": "Equipment added successfully"})

@app.get("/equipment")
def list_equipment():
    conn = get_db()
    cur = conn.execute("SELECT e.*, u.name as farmer_name FROM equipment e JOIN users u ON u.id=e.farmer_id")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

# ---------- Rentals ----------
@app.post("/rentals")
def create_rental():
    data = request.get_json(force=True)
    user_id = data.get("user_id")
    equipment_id = data.get("equipment_id")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    if not all([user_id, equipment_id, start_date, end_date]):
        return jsonify({"error": "Missing fields"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO rentals (user_id,equipment_id,start_date,end_date) VALUES (?,?,?,?)",
        (user_id,equipment_id,start_date,end_date)
    )
    conn.commit()
    rental_id = cur.lastrowid
    conn.close()
    return jsonify({"id": rental_id, "message": "Rental booked successfully"})

@app.get("/rentals")
def list_rentals():
    conn = get_db()
    cur = conn.execute("""
        SELECT r.*, e.name as equipment_name, u.name as user_name
        FROM rentals r
        JOIN equipment e ON e.id=r.equipment_id
        JOIN users u ON u.id=r.user_id
    """)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

# ---------- Serve uploaded images ----------
@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

# ---------- Catch-all frontend ----------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_static(path):
    if path == "":
        return send_from_directory(app.static_folder, "index.html")
    candidate = os.path.join(app.static_folder, path)
    if os.path.exists(candidate) and os.path.isfile(candidate):
        return send_from_directory(app.static_folder, path)
    if not path.endswith(".html"):
        candidate_html = os.path.join(app.static_folder, path + ".html")
        if os.path.exists(candidate_html):
            return send_from_directory(app.static_folder, path + ".html")
    return jsonify({"error": "Not found", "path": path}), 404

# ---------- Run ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
