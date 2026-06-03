const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const db = new Database('database.sqlite', { verbose: console.log });

// Activer les clés étrangères
db.pragma('foreign_keys = ON');

// Création des tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration TEXT UNIQUE NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    mileage INTEGER,
    insurance_expiry TEXT,
    inspection_date TEXT
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference TEXT NOT NULL,
    driver INTEGER,
    vehicle INTEGER,
    destination TEXT NOT NULL,
    departure_date TEXT NOT NULL,
    return_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY(vehicle) REFERENCES vehicles(id),
    FOREIGN KEY(driver) REFERENCES drivers(id)
  );

  CREATE TABLE IF NOT EXISTS maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    cost REAL,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS fuel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    liters REAL NOT NULL,
    cost REAL NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
  );
`);

// Insérer l'utilisateur par défaut s'il n'existe pas
const checkUser = db.prepare('SELECT id FROM users WHERE email = ?').get('contact@flotte.com');
if (!checkUser) {
  const hash = bcrypt.hashSync('flotte2026', 10);
  db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run('contact@flotte.com', hash);
  console.log('Utilisateur par défaut créé : contact@flotte.com / flotte2026');
}

// Données fictives pour le démarrage (facultatif mais utile pour voir que ça marche)
const checkVehicles = db.prepare('SELECT count(*) as count FROM vehicles').get();
if (checkVehicles.count === 0) {
  db.prepare("INSERT INTO vehicles (registration, brand, model, status, mileage, insurance_expiry, inspection_date) VALUES (?, ?, ?, ?, ?, ?, ?)").run('AB-123-CD', 'Renault', 'Master', 'active', 45000, '2027-01-01', '2026-12-01');
  db.prepare("INSERT INTO drivers (name, license_number, phone, status) VALUES (?, ?, ?, ?)").run('Jean Dupont', 'PERM-12345', '0601020304', 'active');
}

module.exports = db;
