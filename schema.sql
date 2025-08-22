-- Users (farmers + buyers)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('farmer','buyer')) NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Crops listed by farmers
CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id INTEGER NOT NULL,
    crop_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    image_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(farmer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Orders / bids placed by buyers
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,
    bid_price REAL,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected, bought
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(crop_id) REFERENCES crops(id) ON DELETE CASCADE,
    FOREIGN KEY(buyer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Equipment listed for rent by farmers
CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    rent_price REAL NOT NULL,      -- per day
    available INTEGER DEFAULT 1,   -- 1 = true, 0 = false
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(farmer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Rental bookings
CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,      -- who booked it
    start_date TEXT NOT NULL,      -- ISO date yyyy-mm-dd
    end_date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
