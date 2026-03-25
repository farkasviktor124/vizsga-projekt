// backend/server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;

// Middleware 
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Adatbázis fájl elérési útja
const dbPath = path.join(__dirname, 'webshopretrog.db');

// Ellenőrizzük a fájl jogosultságokat
try {
  if (!fs.existsSync(dbPath)) {
    console.log(' Adatbázis fájl nem létezik, létrehozás...');
    fs.writeFileSync(dbPath, '');
  }

  fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
  console.log(' Adatbázis fájl írható és olvasható');
} catch (err) {
  console.error(' Adatbázis fájl jogosultság hiba:', err.message);
  process.exit(1);
}

// SQLite adatbázis
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(' Nem sikerült csatlakozni:', err.message);
    process.exit(1);
  } else {
    console.log(' SQLite adatbázis csatlakoztatva: webshopretrog.db');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users tábla
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
      )
    `);

    // Termékek tábla (alap)
    db.run(`
      CREATE TABLE IF NOT EXISTS termekek (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nev TEXT NOT NULL,
        ar REAL NOT NULL,
        allapot TEXT,
        evjarat TEXT,
        gyarto TEXT,
        arus TEXT, 
        termektipus TEXT,
        leiras TEXT
      )
    `);

    // Ellenőrizzük a hiányzó oszlopokat
    db.all("PRAGMA table_info(termekek)", (err, rows) => {
      if (err) return console.error(err);

      const hasTermekTipus = rows.some(col => col.name === 'termekTipus');
      const hasLeiras = rows.some(col => col.name === 'leiras');

      if (!hasTermekTipus) {
        db.run("ALTER TABLE termekek ADD COLUMN termekTipus TEXT", (err) => {
          if (err) console.error(" Hiba termekTipus hozzáadásakor:", err.message);
          else console.log(" termekTipus oszlop hozzáadva");
        });
      }

      if (!hasLeiras) {
        db.run("ALTER TABLE termekek ADD COLUMN leiras TEXT", (err) => {
          if (err) console.error(" Hiba leiras hozzáadásakor:", err.message);
          else console.log(" leiras oszlop hozzáadva");
        });
      }
    });

    // Ellenőrizzük a users tábla role oszlopát
    db.all("PRAGMA table_info(users)", (err, rows) => {
      if (err) return console.error(err);
      const hasRoleColumn = rows.some(col => col.name === 'role');
      if (!hasRoleColumn) {
        db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", (err) => {
          if (err) console.error(" Hiba role oszlop hozzáadásakor:", err.message);
          else console.log("📦 role oszlop hozzáadva");
        });
      }
    });

    // Alapértelmezett admin felhasználók
    const admins = [
      { username: 'Teszt admin', email: 'admin@admin.com', password: 'admin123' },
      { username: 'Peti admin', email: 'peti.admin@test.com', password: 'admin123' }
    ];

    admins.forEach(admin => {
      db.get("SELECT COUNT(*) as count FROM users WHERE email = ?", [admin.email], (err, row) => {
        if (err) return;
        if (row.count === 0) {
          db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'admin')", 
            [admin.username, admin.email, admin.password]);
        } else {
          db.run("UPDATE users SET role = 'admin' WHERE email = ?", [admin.email]);
        }
      });
    });

    // Teszt user
    db.get("SELECT COUNT(*) as count FROM users WHERE email = 'user@test.com'", (err, row) => {
      if (err) return;
      if (row.count === 0) {
        db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')", 
          ['Teszt user', 'user@test.com', 'user123']);
      }
    });
  });

  // Ellenőrzés
  setTimeout(() => {
    db.all("SELECT id, username, email, role FROM users", [], (err, rows) => {
      if (err) return;
      console.log("📊 Felhasználók szerepkörökkel:");
      rows.forEach(user => {
        const icon = user.role === 'admin' ? '👑' : 
                     user.role === 'seller' ? '🛒' : '🛍️';
        console.log(`   ${icon} ${user.email} (${user.role})`);
      });
    });
  }, 500);
}

// -----------------------------
// 🔐 AUTH VÉGPONTOK
// -----------------------------

{app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!user || user.password !== password) return res.status(401).json({ success: false, error: "Hibás email vagy jelszó!" });
    res.json({ success: true, token: `token-${user.id}-${Date.now()}`, user: { id: user.id, username: user.username, email: user.email, role: user.role || 'user' } });
  });
});}

app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;
  db.get("SELECT id FROM users WHERE email = ?", [email], (err, existing) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (existing) return res.status(400).json({ success: false, error: "Az email már létezik!" });
    db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')", [username, email, password], function(err){
      if(err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: "Sikeres regisztráció!", user: { id: this.lastID, username, email, role: "user" } });
    });
  });
});

// -----------------------------
// 🔹 TERMÉK VÉGPONTOK
// -----------------------------

app.get("/termekek", (req, res) => {
  db.all("SELECT * FROM termekek ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

app.post("/termekek", (req, res) => {
  const { nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras } = req.body;
  if (!nev || !ar) return res.status(400).json({ message: "Hiányzó adatok!" });
  db.run(`
    INSERT INTO termekek (nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [nev, ar, allapot || null, evjarat || null, gyarto || null, arus || null, termekTipus || null, leiras || null], function(err){
    if(err) return res.status(500).json({ message: err.message });
    res.json({ success: true, message: "Termék sikeresen mentve!", termekId: this.lastID });
  });
});

// -----------------------------
// Backend indítása
// -----------------------------
app.listen(PORT, () => {
  console.log(`✅ Backend fut: http://localhost:${PORT}`);
  console.log(`   Teszt: http://localhost:${PORT}/api/test`);
  console.log(`   Bejelentkezés: admin@admin.com / admin123`);
  console.log(`   Admin users: http://localhost:${PORT}/api/admin/users`);
});