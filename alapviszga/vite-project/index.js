const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 4000;

// Middleware-ek
app.use(cors());
app.use(bodyParser.json());

// SQLite adatbázis megnyitása (vagy létrehozása)
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Nem sikerült csatlakozni az adatbázishoz', err);
  } else {
    console.log('Csatlakozva az SQLite adatbázishoz.');
  }
});

// Tábla létrehozása, ha még nincs
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,   -- login, register, seller
    username TEXT,
    email TEXT NOT NULL,
    password TEXT NOT NULL
  )
`);

// Új felhasználó hozzáadása
app.post('/api/users', (req, res) => {
  const { type, username, email, password } = req.body;

  if (!email || !password || !type) {
    return res.status(400).json({ error: 'Hiányzó adatok!' });
  }

  const stmt = db.prepare(`
    INSERT INTO users (type, username, email, password) VALUES (?, ?, ?, ?)
  `);

  stmt.run(type, username || null, email, password, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Adatbázis hiba' });
    }
    res.json({ success: true, userId: this.lastID });
  });
});

app.listen(PORT, () => {
  console.log(`Backend fut a http://localhost:${PORT} címen`);
});
