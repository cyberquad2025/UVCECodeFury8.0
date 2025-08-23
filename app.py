from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
from pathlib import Path
import datetime

DB_PATH = os.environ.get("DB_PATH", "database.db")
FRONTEND_DIR = "frontend"

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app, resources={r"/*": {"origins": "*"}})


# ---------- Database helpers ----------
def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    # run schema.sql if exists
    schema_path = Path("schema.sql")
    if schema_path.exists():
        with open(schema_path, "r", encoding="utf-8") as f:
            schema = f.read()
        conn = get_db()
        conn.executescript(schema)
        conn.commit()
        conn.close()

    # Ensure market_prices table exists (useful if schema.sql wasn't updated)
    conn = get_db()
    conn.execute("""
    CREATE TABLE IF NOT EXISTS market_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_name TEXT NOT NULL,
      region TEXT NOT NULL,
      min_price REAL NOT NULL,
      max_price REAL NOT NULL,
      avg_price REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()

    # Seed sample data if table empty
    cur = conn.execute("SELECT COUNT(*) as cnt FROM market_prices")
    cnt = cur.fetchone()["cnt"]
    if cnt == 0:
        sample = [
            ("Wheat","Punjab",18,24,21,"kg"),
            ("Wheat","Maharashtra",17,23,20,"kg"),
            ("Rice","Tamil Nadu",22,30,26,"kg"),
            ("Maize","Karnataka",14,19,16.5,"kg"),
            ("Onion","Maharashtra",12,20,16,"kg"),
            ("Tomato","Karnataka",8,16,12,"kg")
        ]
        for entry in sample:
            conn.execute("""INSERT INTO market_prices
                            (crop_name,region,min_price,max_price,avg_price,unit,updated_at)
                            VALUES (?,?,?,?,?,?,?)""",
                         (entry[0],entry[1],entry[2],entry[3],entry[4],entry[5], datetime.datetime.utcnow()))
        conn.commit()
    conn.close()

# Initialize DB if first run
if not os.path.exists(DB_PATH):
    init_db()
else:
    # still ensure market_prices table exists/seeded
    init_db()


# ---------- Health ----------
@app.get("/api")
def health():
    return jsonify({"ok": True, "service": "AgriMitra Flask API", "db": os.path.abspath(DB_PATH)})


# ---------- Auth (signup/login) ----------
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


# ---------- Orders ----------
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
        params.append(int(available))
    if farmer_id:
        sql += " AND e.farmer_id = ?"
        params.append(farmer_id)

    conn = get_db()
    cur = conn.execute(sql, tuple(params))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)


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


# ---------- Market Prices (used by ticker) ----------
@app.get("/market_prices")
def get_market_prices():
    crop = request.args.get("crop")
    region = request.args.get("region")
    limit = int(request.args.get("limit", 50))

    sql = "SELECT * FROM market_prices WHERE 1=1"
    params = []
    if crop:
        sql += " AND LOWER(crop_name) = ?"
        params.append(crop.lower())
    if region:
        sql += " AND LOWER(region) = ?"
        params.append(region.lower())
    sql += " ORDER BY updated_at DESC LIMIT ?"
    params.append(limit)

    conn = get_db()
    cur = conn.execute(sql, tuple(params))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

@app.post("/market_prices")
def add_market_price():
    data = request.get_json(force=True)
    need = ["crop_name","region","min_price","max_price","avg_price"]
    if not all(k in data for k in need):
        return jsonify({"error":"Missing fields"}), 400
    unit = data.get("unit","kg")
    conn = get_db()
    conn.execute("""INSERT INTO market_prices (crop_name,region,min_price,max_price,avg_price,unit,updated_at)
                    VALUES (?,?,?,?,?,?,?)""",
                 (data["crop_name"], data["region"], data["min_price"], data["max_price"], data["avg_price"], unit, datetime.datetime.utcnow()))
    conn.commit()
    conn.close()
    return jsonify({"message":"Price added"})


# ---------- Static frontend serving (catch-all) ----------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_static(path):
    # Allow API paths to be handled above; here we only serve frontend files.
    # Normalize and check files in frontend/
    if path == "":
        return send_from_directory(app.static_folder, "index.html")

    # If request is for an API (starts with api/market etc), reject here
    if path.startswith("api") or path.startswith("static") or path.startswith("market_") or path.startswith("crops") or path.startswith("login") or path.startswith("signup") or path.startswith("equipment") and not path.endswith(".html"):
        # let defined API routes handle them; if not found, return 404
        # But we only reach here for unmatched paths => 404
        abort(404)

    # try to serve the file directly
    candidate = os.path.join(app.static_folder, path)
    if os.path.exists(candidate) and os.path.isfile(candidate):
        return send_from_directory(app.static_folder, path)

    # try with .html appended
    if not path.endswith(".html"):
        candidate_html = os.path.join(app.static_folder, path + ".html")
        if os.path.exists(candidate_html):
            return send_from_directory(app.static_folder, path + ".html")

    # fallback: index (single page apps) if you prefer; for now return 404 JSON
    return jsonify({"error": "Not found", "path": path}), 404


# ---------- Run ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
