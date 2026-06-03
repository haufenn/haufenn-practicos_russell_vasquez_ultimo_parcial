const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./inventario.db');

// Crear tablas
db.serialize(() => {

  // Usuarios
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE,
      password TEXT
    )
  `);

  // Productos
  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      categoria TEXT,
      unidad TEXT,
      precio REAL,
      stock INTEGER DEFAULT 0
    )
  `);

  // Movimientos
  db.run(`
    CREATE TABLE IF NOT EXISTS movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER,
      tipo TEXT,
      cantidad INTEGER,
      fecha TEXT,
      usuario_id INTEGER,
      FOREIGN KEY(producto_id) REFERENCES productos(id),
      FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
    )
  `);

});

module.exports = db;