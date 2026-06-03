const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const server = http.createServer((req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // ── LOGIN ──────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/login') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      const data = JSON.parse(body);
      db.get(
        `SELECT * FROM usuarios WHERE usuario = ? AND password = ?`,
        [data.usuario, data.password],
        (err, row) => {
          if (err) { res.writeHead(500); return res.end('Error'); }
          if (row) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, usuario: data.usuario }));
          } else {
            res.writeHead(401);
            res.end(JSON.stringify({ success: false }));
          }
        }
      );
    });

  // ── GET PRODUCTOS ──────────────────────────────────────
  } else if (req.method === 'GET' && req.url === '/productos') {
    db.all(`SELECT * FROM productos`, [], (err, rows) => {
      if (err) { res.writeHead(500); return res.end('Error'); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
    });

  // ── POST PRODUCTO ──────────────────────────────────────
  } else if (req.method === 'POST' && req.url === '/productos') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      const data = JSON.parse(body);
      db.run(
        `INSERT INTO productos (nombre, categoria, unidad, precio) VALUES (?, ?, ?, ?)`,
        [data.nombre, data.categoria, data.unidad, data.precio],
        function(err) {
          if (err) { res.writeHead(500); return res.end('Error'); }
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id: this.lastID }));
        }
      );
    });

  // ── GET MOVIMIENTOS ────────────────────────────────────
  } else if (req.method === 'GET' && req.url === '/movimientos') {
    db.all(
      `SELECT m.*, p.nombre AS producto_nombre
       FROM movimientos m
       LEFT JOIN productos p ON m.producto_id = p.id`,
      [],
      (err, rows) => {
        if (err) { res.writeHead(500); return res.end('Error'); }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(rows));
      }
    );

  // ── POST MOVIMIENTO ────────────────────────────────────
  } else if (req.method === 'POST' && req.url === '/movimientos') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      const data = JSON.parse(body);
      db.serialize(() => {
        // Insertar movimiento
        db.run(
          `INSERT INTO movimientos (producto_id, tipo, cantidad, fecha, usuario_id)
           VALUES (?, ?, ?, ?, ?)`,
          [data.producto_id, data.tipo, data.cantidad, data.fecha, data.usuario_id],
          function(err) {
            if (err) { res.writeHead(500); return res.end('Error'); }
          }
        );
        // Actualizar stock según el tipo
        const delta = data.tipo === 'entrada' ? data.cantidad
                    : data.tipo === 'salida'  ? -data.cantidad
                    : 0; // ajuste no modifica stock automáticamente
        if (delta !== 0) {
          db.run(
            `UPDATE productos SET stock = stock + ? WHERE id = ?`,
            [delta, data.producto_id]
          );
        }
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      });
    });

  // ── SERVIR ARCHIVOS ESTÁTICOS ──────────────────────────
  } else {
    let filePath = '.' + (req.url === '/' ? '/login.html' : req.url);
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.webmanifest': 'application/json',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.avif': 'image/avif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    }[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
      if (err) { res.writeHead(404); return res.end('Archivo no encontrado'); }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  }

});

server.listen(3000, () => console.log('Servidor en http://localhost:3000'));