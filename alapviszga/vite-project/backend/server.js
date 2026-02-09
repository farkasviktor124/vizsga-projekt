// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 4000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' })); // csak a frontend portját engedi
app.use(bodyParser.json());

// SQLite adatbázis
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) console.error(err.message);
  else console.log('SQLite adatbázis csatlakoztatva');
});

// Tábla létrehozása
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    username TEXT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )
`);

// Regisztráció
app.post('/api/users', (req, res) => {
  const { type, username, email, password } = req.body;

  if (!email || !password || !type) {
    return res.status(400).json({ error: 'Hiányzó adatok!' });
  }

  const stmt = db.prepare(`INSERT INTO users (type, username, email, password) VALUES (?, ?, ?, ?)`);
  stmt.run(type, username || null, email, password, function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed: users.email')) {
        return res.status(400).json({ error: 'Ez az e-mail már regisztrálva van!' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, userId: this.lastID });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Hiányzó e-mail vagy jelszó!' });

  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(400).json({ error: 'Helytelen e-mail vagy jelszó' });
    res.json({ success: true, userId: row.id, type: row.type });
  });
});

// Server indítása
app.listen(PORT, () => {
  console.log(`Backend fut a http://localhost:${PORT}`);
});
