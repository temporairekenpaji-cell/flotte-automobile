const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super_secret_flotte_key_2026';

// Middleware d'authentification
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

// === AUTHENTIFICATION ===
app.post('/api/auth/login/', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, email: user.email });
});

// Toutes les routes suivantes nécessitent d'être connecté
app.use('/api', authenticate);

// === DASHBOARD ===
app.get('/api/dashboard/', (req, res) => {
  const totalVehicles = db.prepare('SELECT count(*) as c FROM vehicles').get().c;
  const activeVehicles = db.prepare("SELECT count(*) as c FROM vehicles WHERE status = 'active'").get().c;
  const maintenanceVehicles = db.prepare("SELECT count(*) as c FROM vehicles WHERE status = 'maintenance'").get().c;
  
  const fuelRow = db.prepare('SELECT sum(liters) as total_liters FROM fuel').get();
  const fuelConsumption = fuelRow.total_liters || 0;
  
  const activeMissions = db.prepare("SELECT count(*) as c FROM missions WHERE status = 'in_progress'").get().c;
  
  // Formule: Taux d'utilisation = (Véhicules actifs / Véhicules totaux) * 100
  let fleetUtilization = 0;
  if (totalVehicles > 0) {
    fleetUtilization = Math.round((activeVehicles / totalVehicles) * 100);
  }

  res.json({
    total_vehicles: totalVehicles,
    active_vehicles: activeVehicles,
    maintenance_vehicles: maintenanceVehicles,
    fuel_consumption: fuelConsumption,
    active_missions: activeMissions,
    fleet_utilization: fleetUtilization,
    alerts: [] // Pour l'instant on laisse un tableau vide
  });
});

// === HELPER POUR LE CRUD ===
function createCRUDRoutes(resource, table) {
  // GET all
  app.get(`/api/${resource}/`, (req, res) => {
    let query;
    if (resource === 'missions') {
      query = `SELECT m.*, d.name as driver_name, v.registration as vehicle_plate 
               FROM missions m 
               LEFT JOIN drivers d ON m.driver = d.id 
               LEFT JOIN vehicles v ON m.vehicle = v.id 
               ORDER BY m.id DESC`;
    } else if (resource === 'maintenance') {
      query = `SELECT m.*, v.registration as vehicle_registration
               FROM maintenance m
               LEFT JOIN vehicles v ON m.vehicle_id = v.id
               ORDER BY m.id DESC`;
    } else if (resource === 'fuel') {
      query = `SELECT f.*, v.registration as vehicle_registration
               FROM fuel f
               LEFT JOIN vehicles v ON f.vehicle_id = v.id
               ORDER BY f.id DESC`;
    } else {
      query = `SELECT * FROM ${table} ORDER BY id DESC`;
    }

    if (req.query.limit) {
      query += ` LIMIT ${parseInt(req.query.limit)}`;
    }
    const items = db.prepare(query).all();
    res.json({ results: items });
  });

  // POST create
  app.post(`/api/${resource}/`, (req, res) => {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map(() => '?').join(', ');
    
    try {
      const stmt = db.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`);
      const info = stmt.run(...values);
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // PUT update
  app.put(`/api/${resource}/:id`, (req, res) => {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    
    try {
      const stmt = db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`);
      stmt.run(...values, req.params.id);
      res.json({ id: req.params.id, ...req.body });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE
  app.delete(`/api/${resource}/:id`, (req, res) => {
    try {
      db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
}

// === GÉNÉRER LES ROUTES CRUD ===
createCRUDRoutes('vehicles', 'vehicles');
createCRUDRoutes('drivers', 'drivers');
createCRUDRoutes('missions', 'missions');
createCRUDRoutes('maintenance', 'maintenance');
createCRUDRoutes('fuel', 'fuel');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
