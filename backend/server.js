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
    console.log('📁 Adatbázis fájl nem létezik, létrehozás...');
    fs.writeFileSync(dbPath, '');
  }
  
  fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
  console.log('✅ Adatbázis fájl írható és olvasható');
} catch (err) {
  console.error('❌ Adatbázis fájl jogosultság hiba:', err.message);
  process.exit(1);
}

// SQLite adatbázis
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('❌ Nem sikerült csatlakozni:', err.message);
    process.exit(1);
  } else {
    console.log('✅ SQLite adatbázis csatlakoztatva: webshopretrog.db');
    // Szekvenciális inicializálás
    db.serialize(() => {
      initializeDatabase();
    });
  }
});

function initializeDatabase() {
  // Users tábla létrehozása
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user'
    )
  `);

  // Termékek tábla létrehozása
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

  // Role oszlop ellenőrzése (ha régi a tábla)
  db.all("PRAGMA table_info(users)", (err, rows) => {
    if (err) {
      console.error("❌ Hiba a tábla info lekérésekor:", err.message);
      return;
    }
    
    const hasRoleColumn = rows.some(col => col.name === 'role');
    if (!hasRoleColumn) {
      console.log("📦 role oszlop hozzáadása a users táblához...");
      db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", (err) => {
        if (err) {
          console.error("❌ Hiba role oszlop hozzáadásakor:", err.message);
        } else {
          console.log("✅ role oszlop hozzáadva");
        }
      });
    }
  });

  // Alapértelmezett admin beállítása
  db.get("SELECT COUNT(*) as count FROM users WHERE email = 'admin@admin.com'", (err, row) => {
    if (err) return;
    
    if (row.count === 0) {
      console.log("📦 Admin felhasználó létrehozása...");
      db.run(`
        INSERT INTO users (username, email, password, role) VALUES 
        ('Teszt admin', 'admin@admin.com', 'admin123', 'admin')
      `);
    } else {
      // Ha létezik, biztosítsuk hogy admin legyen
      db.run("UPDATE users SET role = 'admin' WHERE email = 'admin@admin.com'");
    }
  });

  // Peti admin beállítása
  db.get("SELECT COUNT(*) as count FROM users WHERE email = 'peti.admin@test.com'", (err, row) => {
    if (err) return;
    
    if (row.count === 0) {
      db.run(`
        INSERT INTO users (username, email, password, role) VALUES 
        ('Peti admin', 'peti.admin@test.com', 'admin123', 'admin')
      `);
    } else {
      db.run("UPDATE users SET role = 'admin' WHERE email = 'peti.admin@test.com'");
    }
  });

  // Teszt user beállítása
  db.get("SELECT COUNT(*) as count FROM users WHERE email = 'user@test.com'", (err, row) => {
    if (err) return;
    
    if (row.count === 0) {
      db.run(`
        INSERT INTO users (username, email, password, role) VALUES 
        ('Teszt user', 'user@test.com', 'user123', 'user')
      `);
    }
  });

  // A meglévő felhasználók role-jának beállítása (ha NULL)
  db.run("UPDATE users SET role = 'user' WHERE role IS NULL");

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

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  console.log("Bejelentkezési kísérlet:", username);

  db.get(`SELECT * FROM users WHERE email = ?`, [username], (err, user) => {
    if (err) {
      console.error("Adatbázis hiba:", err);
      return res.status(500).json({ success: false, error: "Adatbázis hiba" });
    }
    
    if (!user) {
      return res.status(401).json({ success: false, error: "Hibás email vagy jelszó!" });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, error: "Hibás email vagy jelszó!" });
    }

    console.log(`✅ Bejelentkezett: ${user.email} (${user.role || 'user'})`);

    res.json({
      success: true,
      token: `token-${user.id}-${Date.now()}`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user'
      }
    });
  });
});

app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;
  console.log("Regisztráció:", { username, email });

  db.get("SELECT id FROM users WHERE email = ?", [email], (err, existing) => {
    if (err) {
      console.error("Regisztrációs hiba:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    
    if (existing) {
      return res.status(400).json({ success: false, error: "Az email már létezik!" });
    }

    db.run(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')",
      [username, email, password],
      function(err) {
        if (err) {
          console.error("Beszúrási hiba:", err);
          return res.status(500).json({ success: false, error: err.message });
        }

        console.log(`✅ Új felhasználó: ${email}`);

        res.json({
          success: true,
          message: "Sikeres regisztráció!",
          user: {
            id: this.lastID,
            username,
            email,
            role: "user"
          }
        });
      }
    );
  });
});

// -----------------------------
// 👑 ADMIN VÉGPONTOK
// -----------------------------

app.get("/api/admin/users", (req, res) => {
  db.all("SELECT id, username, email, role FROM users", [], (err, rows) => {
    if (err) {
      console.error("Admin users hiba:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.delete("/api/admin/users/:id", (req, res) => {
  const { id } = req.params;
  
  db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
    if (err) {
      console.error("Törlési hiba:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: "Felhasználó törölve" });
  });
});

// -----------------------------
// 🔹 TERMÉK VÉGPONTOK
// -----------------------------

app.get("/termekek", (req, res) => {
  db.all("SELECT * FROM termekek ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      console.error("Termék lekérési hiba:", err);
      return res.status(500).json({ message: err.message });
    }
    res.json(rows);
  });
});

app.get("/api/termekek", (req, res) => {
  db.all("SELECT * FROM termekek ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      console.error("Termék lekérési hiba:", err);
      return res.status(500).json({ message: err.message });
    }
    res.json(rows);
  });
});

app.post("/termekek", (req, res) => {
  const { nev, ar, allapot, evjarat, gyarto, arus } = req.body;

  if (!nev || !ar) {
    return res.status(400).json({ message: "Hiányzó adatok!" });
  }

  db.run(`
    INSERT INTO termekek (nev, ar, allapot, evjarat, gyarto, arus)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [nev, ar, allapot || null, evjarat || null, gyarto || null, arus || null], function(err) {
    if (err) {
      console.error("Termék mentési hiba:", err);
      return res.status(500).json({ message: err.message });
    }

    res.json({
      success: true,
      message: "Termék sikeresen mentve!",
      termekId: this.lastID
    });
  });
});

app.post("/api/termekek", (req, res) => {
  const { nev, ar, allapot, evjarat, gyarto, arus } = req.body;

  if (!nev || !ar) {
    return res.status(400).json({ message: "Hiányzó adatok!" });
  }

  db.run(`
    INSERT INTO termekek (nev, ar, allapot, evjarat, gyarto, arus)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [nev, ar, allapot || null, evjarat || null, gyarto || null, arus || null], function(err) {
    if (err) {
      console.error("Termék mentési hiba:", err);
      return res.status(500).json({ message: err.message });
    }

    res.json({
      success: true,
      message: "Termék sikeresen mentve!",
      termekId: this.lastID
    });
  });
});

// -----------------------------
// TESZT VÉGPONT
// -----------------------------
app.get("/api/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Backend működik!",
    time: new Date().toLocaleString()
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