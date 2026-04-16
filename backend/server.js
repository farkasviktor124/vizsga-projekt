// backend/server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Uploads mappa letrehozasa
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('Uploads mappa letrehozva');
}

// Multer beallitas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Csak kep fajlok tolthetok fel!'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// Adatbazis
const dbPath = path.join(__dirname, 'webshopretrog.db');

try {
  if (!fs.existsSync(dbPath)) {
    console.log('Adatbazis fajl nem letezik, letrehozas...');
    fs.writeFileSync(dbPath, '');
  }
  fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
  console.log('Adatbazis fajl olvashato es irhato');
} catch (err) {
  console.error('Adatbazis fajl jogosultsag hiba:', err.message);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Nem sikerult csatlakozni:', err.message);
    process.exit(1);
  } else {
    console.log('SQLite adatbazis csatlakoztatva: webshopretrog.db');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users tabla
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
      )
    `, (err) => {
      if (err) console.error('Users tabla hiba:', err.message);
      else console.log('Users tabla kesz');
    });

    // Termekek tabla
    db.run(`
      CREATE TABLE IF NOT EXISTS termekek (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nev TEXT NOT NULL,
        ar REAL NOT NULL,
        allapot TEXT,
        evjarat INTEGER,
        gyarto TEXT,
        arus TEXT, 
        termekTipus TEXT,
        leiras TEXT,
        kep TEXT
      )
    `, (err) => {
      if (err) console.error('Termekek tabla hiba:', err.message);
      else console.log('Termekek tabla kesz');
    });

    // Ellenorizzuk es adjuk hozza a hianyzO oszlopokat (csak ha nem leteznek)
    db.all("PRAGMA table_info(termekek)", (err, rows) => {
      if (err) return console.error(err);
      
      const columnNames = rows.map(row => row.name);
      
      if (!columnNames.includes('termekTipus')) {
        db.run("ALTER TABLE termekek ADD COLUMN termekTipus TEXT", (err) => {
          if (err) console.error('termekTipus hozzaadas hiba:', err.message);
          else console.log('termekTipus oszlop hozzaadva');
        });
      }
      
      if (!columnNames.includes('leiras')) {
        db.run("ALTER TABLE termekek ADD COLUMN leiras TEXT", (err) => {
          if (err) console.error('leiras hozzaadas hiba:', err.message);
          else console.log('leiras oszlop hozzaadva');
        });
      }
      
      if (!columnNames.includes('kep')) {
        db.run("ALTER TABLE termekek ADD COLUMN kep TEXT", (err) => {
          if (err) console.error('kep hozzaadas hiba:', err.message);
          else console.log('kep oszlop hozzaadva');
        });
      }
    });

    // Users tabla role oszlop ellenorzese
    db.all("PRAGMA table_info(users)", (err, rows) => {
      if (err) return console.error(err);
      const hasRole = rows.some(row => row.name === 'role');
      if (!hasRole) {
        db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", (err) => {
          if (err) console.error('role hozzaadas hiba:', err.message);
          else console.log('role oszlop hozzaadva');
        });
      }
    });

    // Varakozas a tablak letrehozasara
    setTimeout(() => {
      // Admin felhasznalok
      const admins = [
        { username: 'Teszt admin', email: 'admin@admin.com', password: 'admin123' },
        { username: 'Peti admin', email: 'peti.admin@test.com', password: 'admin123' }
      ];

      admins.forEach(admin => {
        db.get("SELECT COUNT(*) as count FROM users WHERE email = ?", [admin.email], (err, row) => {
          if (err) return;
          if (row && row.count === 0) {
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
        if (row && row.count === 0) {
          db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')", 
            ['Teszt user', 'user@test.com', 'user123']);
        }
      });

      // Teszt termekek
      db.get("SELECT COUNT(*) as count FROM termekek", (err, row) => {
        if (err) return;
        if (row && row.count === 0) {
          const testTermekek = [
            ['Gibson Les Paul Standard', 450000, 'Uj', 2023, 'Gibson', 'ZeneszBolt Kft.', 'Gitar', 'Klasszikus hangzas', null],
            ['Fender Stratocaster', 320000, 'Hasznalt', 2019, 'Fender', 'Hangszerek Haza', 'Gitar', 'Eredeti hangzas', null],
            ['Yamaha Pacifica', 180000, 'Uj', 2022, 'Yamaha', 'Music Center', 'Gitar', 'Kivalo belepo szint', null]
          ];
          
          testTermekek.forEach(termek => {
            db.run(`INSERT INTO termekek (nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, kep) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, termek);
          });
          console.log('Teszt termekek beszurva');
        }
      });
    }, 200);
  });

  // Felhasznalok listazasa
  setTimeout(() => {
    console.log('\n=== REGISZTRAALT FELHASZNALOK ===');
    db.all("SELECT id, username, email, role FROM users", [], (err, rows) => {
      if (err) return;
      rows.forEach(user => {
        console.log(`ID: ${user.id} | ${user.email} | Szerepkor: ${user.role}`);
      });
      console.log('================================\n');
    });
  }, 500);
}

// ==================== AUTH VEGPONTOK ====================

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  
  console.log(`[LOGIN] Bejelentkezes: ${username}`);
  
  db.get("SELECT * FROM users WHERE email = ?", [username], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!user) {
      console.log(`[LOGIN] Sikertelen: ${username} nem talalhato`);
      return res.status(401).json({ success: false, error: "Hibas email vagy jelszo!" });
    }
    if (user.password !== password) {
      console.log(`[LOGIN] Sikertelen: ${username} rossz jelszo`);
      return res.status(401).json({ success: false, error: "Hibas email vagy jelszo!" });
    }
    
    console.log(`[LOGIN] SIKERES: ${username} (${user.role})`);
    
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
  
  console.log(`[REGISTER] Uj regisztracio: ${email}`);
  
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: "Minden mez kitoltese kotelezo!" });
  }
  
  db.get("SELECT id FROM users WHERE email = ?", [email], (err, existing) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (existing) {
      console.log(`[REGISTER] Sikertelen: ${email} mar letezik`);
      return res.status(400).json({ success: false, error: "Az email mar letezik!" });
    }
    
    db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')", 
      [username, email, password], 
      function(err) {
        if (err) {
          console.log(`[REGISTER] Hiba: ${err.message}`);
          return res.status(500).json({ success: false, error: err.message });
        }
        
        console.log(`[REGISTER] SIKERES: ${email} (ID: ${this.lastID})`);
        
        res.json({ 
          success: true, 
          message: "Sikeres regisztracio!", 
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

// ==================== TERMEK VEGPONTOK ====================

app.get("/termekek", (req, res) => {
  console.log('[GET] Termekek listazasa');
  
  db.all("SELECT * FROM termekek ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    console.log(`[GET] ${rows.length} termek kuldve`);
    res.json(rows);
  });
});

app.get("/termekek/:id", (req, res) => {
  const id = req.params.id;
  console.log(`[GET] Termek lekerese ID: ${id}`);
  
  db.get("SELECT * FROM termekek WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: "Termek nem talalhato" });
    }
    res.json(row);
  });
});

app.post("/termekek", upload.single('kep'), (req, res) => {
  const { nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras } = req.body;
  
  console.log(`[POST] Uj termek: ${nev}`);
  
  if (!nev || !ar) {
    return res.status(400).json({ message: "Nev es ar kotelezo!" });
  }
  
  const kepUrl = req.file ? `/uploads/${req.file.filename}` : null;
  if (req.file) {
    console.log(`[POST] Kep feltoltve: ${req.file.filename}`);
  }
  
  db.run(`
    INSERT INTO termekek (nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, kep)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [nev, ar, allapot || null, evjarat || null, gyarto || null, arus || null, termekTipus || null, leiras || null, kepUrl], 
  function(err) {
    if (err) {
      console.log(`[POST] Hiba: ${err.message}`);
      return res.status(500).json({ message: err.message });
    }
    console.log(`[POST] SIKERES: ${nev} (ID: ${this.lastID})`);
    res.json({ 
      success: true, 
      message: "Termek mentve!", 
      termekId: this.lastID,
      kep: kepUrl
    });
  });
});

app.put("/termekek/:id", upload.single('kep'), (req, res) => {
  const id = req.params.id;
  const { nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras } = req.body;
  
  console.log(`[PUT] Termek frissitese ID: ${id}`);
  
  let kepUrl = null;
  if (req.file) {
    kepUrl = `/uploads/${req.file.filename}`;
    console.log(`[PUT] Uj kep: ${req.file.filename}`);
  }
  
  if (kepUrl) {
    db.run(`
      UPDATE termekek 
      SET nev = ?, ar = ?, allapot = ?, evjarat = ?, gyarto = ?, arus = ?, termekTipus = ?, leiras = ?, kep = ?
      WHERE id = ?
    `, [nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, kepUrl, id], 
    function(err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Termek nem talalhato" });
      }
      console.log(`[PUT] SIKERES: ID ${id} frissitve`);
      res.json({ success: true, message: "Termek frissitve" });
    });
  } else {
    db.run(`
      UPDATE termekek 
      SET nev = ?, ar = ?, allapot = ?, evjarat = ?, gyarto = ?, arus = ?, termekTipus = ?, leiras = ?
      WHERE id = ?
    `, [nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, id], 
    function(err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Termek nem talalhato" });
      }
      console.log(`[PUT] SIKERES: ID ${id} frissitve`);
      res.json({ success: true, message: "Termek frissitve" });
    });
  }
});

app.delete("/termekek/:id", (req, res) => {
  const id = req.params.id;
  console.log(`[DELETE] Termek torlese ID: ${id}`);
  
  db.get("SELECT kep FROM termekek WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    
    db.run("DELETE FROM termekek WHERE id = ?", [id], function(err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Termek nem talalhato" });
      }
      
      if (row && row.kep) {
        const kepPath = path.join(__dirname, row.kep);
        if (fs.existsSync(kepPath)) {
          fs.unlinkSync(kepPath);
          console.log(`[DELETE] Kep torolve: ${row.kep}`);
        }
      }
      
      console.log(`[DELETE] SIKERES: ID ${id} torolve`);
      res.json({ success: true, message: "Termek torolve" });
    });
  });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend mukodik" });
});

app.get("/api/admin/users", (req, res) => {
  db.all("SELECT id, username, email, role FROM users", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// ==================== SZERVER INDITASA ====================

app.listen(PORT, () => {
  console.log(`\nBackend szerver fut: http://localhost:${PORT}`);
  console.log(`Termekek: http://localhost:${PORT}/termekek`);
  console.log(`Teszt: http://localhost:${PORT}/api/test`);
  console.log(`Bejelentkezes: admin@admin.com / admin123`);
  console.log(`\nA terminalban latod a bejelentkezeseket es a muveleteket\n`);
});