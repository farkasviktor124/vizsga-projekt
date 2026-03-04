// backend/server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 4000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' })); // engedélyezzük csak a frontend portot
app.use(express.json());

// SQLite adatbázis (webshopretrog.db)
const db = new sqlite3.Database('./webshopretrog.db', (err) => {
  if (err) console.error(err.message);
  else console.log('SQLite adatbázis csatlakoztatva: webshopretrog.db');
});

// Tábla létrehozása, ha még nincs
db.run(`
  CREATE TABLE IF NOT EXISTS termekek (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nev TEXT NOT NULL,
    ar REAL NOT NULL,
    allapot TEXT,
    evjarat TEXT,
    gyarto TEXT,
    arus TEXT
  )
`);

// -----------------------------
// 🔹 Termékek lekérése (EZ HIÁNYZOTT)
// -----------------------------
app.get("/termekek", (req, res) => {
  db.all("SELECT * FROM termekek", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.json(rows);
  });
});

// -----------------------------
// Termék felvitel
// -----------------------------
app.post("/termekek", (req, res) => {
  const { nev, ar, allapot, evjarat, gyarto, arus } = req.body;

  if (!nev || !ar) {
    return res.status(400).json({ message: "Hiányzó adatok!" });
  }

  const stmt = db.prepare(`
    INSERT INTO termekek (nev, ar, allapot, evjarat, gyarto, arus)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(nev, ar, allapot || null, evjarat || null, gyarto || null, arus || null, function(err) {
    if (err) return res.status(500).json({ message: err.message });

    res.json({
      message: "Termék sikeresen mentve!",
      termekId: this.lastID,
      adat: { nev, ar, allapot, evjarat, gyarto, arus }
    });
  });

  stmt.finalize();
});

// -----------------------------
// Backend indítása
// -----------------------------
app.listen(PORT, () => {
  console.log(`Backend fut a http://localhost:${PORT}`);
});