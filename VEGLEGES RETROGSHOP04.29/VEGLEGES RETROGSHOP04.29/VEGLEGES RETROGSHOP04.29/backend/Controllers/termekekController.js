const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'webshopretrog.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) console.error("DB hiba:", err.message);
});

// GET /termekek
const getTermekek = (req, res) => {
  db.all("SELECT * FROM termekek ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

// POST /termekek
const createTermek = (req, res) => {
  const { nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras } = req.body;

  if (!nev || !ar) return res.status(400).json({ message: "Hiányzó adatok!" });

  db.run(`
    INSERT INTO termekek (nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [nev, ar, allapot || null, evjarat || null, gyarto || null, arus || null, termekTipus || null, leiras || null], function(err){
    if(err) return res.status(500).json({ message: err.message });
    res.json({ success: true, message: "Termék sikeresen mentve!", termekId: this.lastID });
  });
};

module.exports = { getTermekek, createTermek };