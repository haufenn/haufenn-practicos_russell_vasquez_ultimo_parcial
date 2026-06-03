const db = require('./db');

db.run(
  `INSERT INTO usuarios (usuario, password) VALUES (?, ?)`,
  ['admin', '1234'],
  function(err) {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Usuario creado con ID:', this.lastID);
    }
  }
);