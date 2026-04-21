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
  // Users tabla
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active'
    )
  `, (err) => {
    if (err) console.error('Users tabla hiba:', err.message);
    else console.log('Users tabla kesz');
  });

  // Termekek tabla - már keszlet oszloppal együtt
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
      kep TEXT,
      keszlet INTEGER DEFAULT 0
    )
  `, (err) => {
    if (err) {
      console.error('Termekek tabla hiba:', err.message);
    } else {
      console.log('Termekek tabla kesz');
      checkAndAddColumns();
    }
  });

  function checkAndAddColumns() {
    db.all("PRAGMA table_info(termekek)", (err, rows) => {
      if (err) {
        console.error('Hiba a termekek tabla info lekérésekor:', err.message);
        return;
      }
      
      const columnNames = rows.map(row => row.name);
      console.log('Termekek tabla oszlopai:', columnNames.join(', '));

      const columnsToAdd = [];
      
      if (!columnNames.includes('termekTipus')) {
        columnsToAdd.push('termekTipus TEXT');
      }
      if (!columnNames.includes('leiras')) {
        columnsToAdd.push('leiras TEXT');
      }
      if (!columnNames.includes('kep')) {
        columnsToAdd.push('kep TEXT');
      }
      if (!columnNames.includes('keszlet')) {
        columnsToAdd.push('keszlet INTEGER DEFAULT 0');
      }

      let index = 0;
      function addNextColumn() {
        if (index >= columnsToAdd.length) {
          checkUsersColumns();
          return;
        }
        
        const columnDef = columnsToAdd[index];
        const columnName = columnDef.split(' ')[0];
        db.run(`ALTER TABLE termekek ADD COLUMN ${columnDef}`, (err) => {
          if (err) {
            if (!err.message.includes('duplicate column name')) {
              console.error(`${columnName} hozzaadas hiba:`, err.message);
            } else {
              console.log(`${columnName} oszlop már létezik`);
            }
          } else {
            console.log(`${columnName} oszlop sikeresen hozzáadva`);
          }
          index++;
          addNextColumn();
        });
      }
      
      addNextColumn();
    });
  }

  function checkUsersColumns() {
    db.all("PRAGMA table_info(users)", (err, rows) => {
      if (err) {
        console.error('Hiba a users tabla info lekérésekor:', err.message);
        insertTestData();
        return;
      }
      
      const columnNames = rows.map(row => row.name);
      console.log('Users tabla oszlopai:', columnNames.join(', '));

      const columnsToAdd = [];
      
      if (!columnNames.includes('role')) {
        columnsToAdd.push("role TEXT DEFAULT 'user'");
      }
      if (!columnNames.includes('status')) {
        columnsToAdd.push("status TEXT DEFAULT 'active'");
      }

      let index = 0;
      function addNextColumn() {
        if (index >= columnsToAdd.length) {
          insertTestData();
          return;
        }
        
        const columnDef = columnsToAdd[index];
        const columnName = columnDef.split(' ')[0];
        db.run(`ALTER TABLE users ADD COLUMN ${columnDef}`, (err) => {
          if (err) {
            if (!err.message.includes('duplicate column name')) {
              console.error(`${columnName} hozzaadas hiba:`, err.message);
            } else {
              console.log(`${columnName} oszlop már létezik`);
            }
          } else {
            console.log(`${columnName} oszlop sikeresen hozzáadva`);
          }
          index++;
          addNextColumn();
        });
      }
      
      addNextColumn();
    });
  }

  function insertTestData() {
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
            db.run("INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, 'admin', 'active')",
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
          db.run("INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, 'user', 'active')",
            ['Teszt user', 'user@test.com', 'user123']);
        }
      });

      // Teszt termekek
      db.get("SELECT COUNT(*) as count FROM termekek", (err, row) => {
        if (err) return;
        
        if (row && row.count === 0) {
          const testTermekek = [
            ['Gibson Les Paul Standard', 450000, 'Új', 2023, 'Gibson', 'Teszt admin', 'Gitár', 'Klasszikus hangzás, kiváló minőség', null, 5],
            ['Fender Stratocaster', 320000, 'Használt', 2019, 'Fender', 'Teszt admin', 'Gitár', 'Eredeti hangzás, jó állapot', null, 3],
            ['Yamaha Pacifica', 180000, 'Új', 2022, 'Yamaha', 'Teszt user', 'Gitár', 'Kiváló belépő szintű gitár', null, 8],
            ['Marshall JCM800', 350000, 'Használt', 1985, 'Marshall', 'Teszt admin', 'Erősítő', 'Klasszikus rock erősítő', null, 2],
            ['Boss DS-1', 35000, 'Új', 2023, 'Boss', 'Teszt user', 'Effekt', 'Legendás torzító pedál', null, 15],
            ['Roland TD-1K', 220000, 'Új', 2023, 'Roland', 'Teszt admin', 'Dob', 'Elektromos dobfelszerelés kezdőknek', null, 4]
          ];
          
          testTermekek.forEach(termek => {
            db.run(`INSERT INTO termekek (nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, kep, keszlet)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, termek);
          });
          console.log('✅ Teszt termekek beszurva készlettel');
        } else {
          db.run("UPDATE termekek SET keszlet = 5 WHERE keszlet IS NULL", (err) => {
            if (!err) console.log('✅ Meglévő termékek készlet értéke beállítva (alap: 5 db)');
          });
        }
      });
    }, 200);

    setTimeout(() => {
      console.log('\n=== REGISZTRAALT FELHASZNALOK ===');
      db.all("SELECT id, username, email, role FROM users ORDER BY id", [], (err, rows) => {
        if (err) return;
        if (rows.length === 0) {
          console.log('Még nincs regisztrált felhasználó');
        } else {
          rows.forEach(user => {
            console.log(`ID: ${user.id} | ${user.username} | ${user.email} | Szerepkor: ${user.role}`);
          });
        }
        console.log('================================\n');
      });

      console.log('\n=== TERMÉKEK KÉSZLETTEL ===');
      db.all("SELECT id, nev, ar, keszlet FROM termekek ORDER BY id", [], (err, rows) => {
        if (err) return;
        if (rows.length === 0) {
          console.log('Még nincs termék');
        } else {
          rows.forEach(termek => {
            console.log(`ID: ${termek.id} | ${termek.nev} | ${termek.ar} Ft | Készlet: ${termek.keszlet} db`);
          });
        }
        console.log('=============================\n');
      });
    }, 500);
  }
}

// ==================== AUTH VEGPONTOK ====================

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  console.log(`[LOGIN] Bejelentkezes: ${username}`);

  db.get("SELECT * FROM users WHERE email = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!user) {
      console.log(`[LOGIN] Sikertelen: ${username} nem talalhato`);
      return res.status(401).json({ success: false, error: "Hibas email vagy jelszo!" });
    }
    
    if (user.status === 'banned') {
      console.log(`[LOGIN] Sikertelen: ${username} ki van tiltva`);
      return res.status(403).json({ success: false, error: "Felhasznalo ki van tiltva!" });
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
    return res.status(400).json({ success: false, error: "Minden mezo kitoltese kotelezo!" });
  }

  db.get("SELECT id FROM users WHERE email = ?", [email], (err, existing) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (existing) {
      console.log(`[REGISTER] Sikertelen: ${email} mar letezik`);
      return res.status(400).json({ success: false, error: "Az email mar letezik!" });
    }

    db.run("INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, 'user', 'active')",
      [username, email, password],
      function(err) {
        if (err) {
          console.log(`[REGISTER] Hiba: ${err.message}`);
          return res.status(500).json({ success: false, error: err.message });
        }
        console.log(`[REGISTER] SIKERES: ${email} (ID: ${this.lastID})`);
        
        db.all("SELECT id, username, email, role FROM users ORDER BY id", [], (err, rows) => {
          if (!err && rows) {
            console.log('\n=== FRISS REGISZTRAALT FELHASZNALOK LISTAJA ===');
            rows.forEach(user => {
              console.log(`ID: ${user.id} | ${user.username} | ${user.email} | Szerepkor: ${user.role}`);
            });
            console.log('=============================================\n');
          }
        });
        
        res.json({
          success: true,
          message: "Sikeres regisztracio!",
          user: { id: this.lastID, username, email, role: "user" }
        });
      }
    );
  });
});

// ==================== FELHASZNALOK VEGPONTOK ====================

app.get("/api/users", (req, res) => {
  console.log('[GET] Felhasználók listázása');
  db.all("SELECT id, username, email, role, status FROM users ORDER BY username", [], (err, rows) => {
    if (err) {
      console.error('[GET] Hiba:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`[GET] ${rows.length} felhasználó küldve`);
    res.json(rows);
  });
});

app.get("/api/users/:id", (req, res) => {
  const { id } = req.params;
  console.log(`[GET] Felhasználó lekérése ID: ${id}`);
  db.get("SELECT id, username, email, role, status FROM users WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Felhasználó nem található" });
    res.json(row);
  });
});

// ==================== TERMEK VEGPONTOK ====================

app.get("/termekek", (req, res) => {
  console.log('[GET] Termekek listazasa');
  db.all("SELECT * FROM termekek ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    console.log(`[GET] ${rows.length} termek kuldve`);
    res.json(rows);
  });
});

app.get("/termekek/:id", (req, res) => {
  const id = req.params.id;
  console.log(`[GET] Termek lekerese ID: ${id}`);
  db.get("SELECT * FROM termekek WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!row) return res.status(404).json({ message: "Termek nem talalhato" });
    res.json(row);
  });
});

app.post("/termekek", upload.single('kep'), (req, res) => {
  const { nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, keszlet } = req.body;
  console.log(`[POST] Uj termek: ${nev}, Arus: ${arus}, Keszlet: ${keszlet || 0}`);

  if (!nev || !ar) return res.status(400).json({ message: "Nev es ar kotelezo!" });

  const kepUrl = req.file ? `/uploads/${req.file.filename}` : null;
  if (req.file) console.log(`[POST] Kep feltoltve: ${req.file.filename}`);

  db.run(`
    INSERT INTO termekek (nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, kep, keszlet)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [nev, ar, allapot || null, evjarat || null, gyarto || null, arus || null, termekTipus || null, leiras || null, kepUrl, keszlet || 0],
  function(err) {
    if (err) {
      console.log(`[POST] Hiba: ${err.message}`);
      return res.status(500).json({ message: err.message });
    }
    console.log(`[POST] SIKERES: ${nev} (ID: ${this.lastID})`);
    res.json({ success: true, message: "Termek mentve!", termekId: this.lastID, kep: kepUrl });
  });
});

app.put("/termekek/:id", upload.single('kep'), (req, res) => {
  const id = req.params.id;
  const { nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, keszlet } = req.body;
  console.log(`[PUT] Termek frissitese ID: ${id}, Keszlet: ${keszlet}`);

  let kepUrl = null;
  if (req.file) {
    kepUrl = `/uploads/${req.file.filename}`;
    console.log(`[PUT] Uj kep: ${req.file.filename}`);
  }

  const params = kepUrl
    ? [nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, keszlet || 0, kepUrl, id]
    : [nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, keszlet || 0, id];

  const sql = kepUrl
    ? `UPDATE termekek SET nev=?, ar=?, allapot=?, evjarat=?, gyarto=?, arus=?, termekTipus=?, leiras=?, keszlet=?, kep=? WHERE id=?`
    : `UPDATE termekek SET nev=?, ar=?, allapot=?, evjarat=?, gyarto=?, arus=?, termekTipus=?, leiras=?, keszlet=? WHERE id=?`;

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ message: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "Termek nem talalhato" });
    console.log(`[PUT] SIKERES: ID ${id} frissitve`);

    db.get("SELECT * FROM termekek WHERE id = ?", [id], (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(row);
    });
  });
});

app.delete("/termekek/:id", (req, res) => {
  const id = req.params.id;
  console.log(`[DELETE] Termek torlese ID: ${id}`);

  db.get("SELECT kep FROM termekek WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });

    db.run("DELETE FROM termekek WHERE id = ?", [id], function(err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0) return res.status(404).json({ message: "Termek nem talalhato" });

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

// ==================== KÉSZLET KEZELÉS VÉGPONTOK ====================

// Egy termék készletének módosítása (pozitív = csökkent, negatív = növel)
app.post("/api/keszlet/csokkent", (req, res) => {
  const { termekId, mennyiseg } = req.body;
  
  const irany = mennyiseg > 0 ? "csökkentés" : (mennyiseg < 0 ? "visszaállítás" : "nincs változás");
  const absMennyiseg = Math.abs(mennyiseg);
  console.log(`[KÉSZLET] ${irany} - Termék ID: ${termekId}, Mennyiség: ${absMennyiseg} db`);
  
  // Paraméter ellenőrzés
  if (!termekId || mennyiseg === undefined || mennyiseg === null) {
    console.error("[KÉSZLET] Érvénytelen paraméterek:", { termekId, mennyiseg });
    return res.status(400).json({ success: false, message: "Érvénytelen paraméterek!" });
  }
  
  // Ha mennyiseg = 0, akkor nincs változás
  if (mennyiseg === 0) {
    return res.json({ success: true, ujKeszlet: null, message: "Nincs változás" });
  }
  
  db.get("SELECT keszlet, nev FROM termekek WHERE id = ?", [termekId], (err, row) => {
    if (err) {
      console.error("[KÉSZLET] Lekérési hiba:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    
    if (!row) {
      console.error("[KÉSZLET] Termék nem található, ID:", termekId);
      return res.status(404).json({ success: false, message: "Termék nem található!" });
    }
    
    let ujKeszlet = row.keszlet - mennyiseg;
    
    // Csak csökkentésnél ellenőrizzük, hogy nem megy-e negatívba
    if (mennyiseg > 0 && ujKeszlet < 0) {
      console.log(`[KÉSZLET] Elutasítva - ${row.nev}: nincs elég készlet (jelenleg: ${row.keszlet}, kért: ${mennyiseg})`);
      return res.status(400).json({ 
        success: false, 
        message: `Nincs elegendő készlet! (${row.nev} - csak ${row.keszlet} db van)` 
      });
    }
    
    db.run("UPDATE termekek SET keszlet = ? WHERE id = ?", [ujKeszlet, termekId], function(err) {
      if (err) {
        console.error("[KÉSZLET] Frissítési hiba:", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      const valtozasSzoveg = mennyiseg > 0 ? `-${mennyiseg}` : `+${Math.abs(mennyiseg)}`;
      console.log(`[KÉSZLET] SIKERES: ${row.nev} ${row.keszlet} -> ${ujKeszlet} db (${valtozasSzoveg})`);
      
      res.json({ 
        success: true, 
        ujKeszlet,
        termek: { id: termekId, nev: row.nev, keszlet: ujKeszlet }
      });
    });
  });
});

// Több termék készletének csökkentése egyszerre (kosárból)
app.post("/api/keszlet/tomeges-csokkent", (req, res) => {
  const { items } = req.body;
  
  console.log(`[KÉSZLET] Tömeges csökkentés: ${items?.length || 0} tétel`);
  
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "Nincsenek tételek!" });
  }
  
  const updates = [];
  const errors = [];
  
  const processItems = (index) => {
    if (index >= items.length) {
      if (errors.length > 0) {
        console.log(`[KÉSZLET] Tömeges csökkentés részben sikertelen: ${errors.length} hiba`);
        return res.status(400).json({ success: false, errors, partialSuccess: updates.length > 0 });
      }
      console.log(`[KÉSZLET] Tömeges csökkentés sikeres: ${updates.length} termék frissítve`);
      return res.json({ success: true, updates });
    }
    
    const item = items[index];
    
    db.get("SELECT keszlet, nev FROM termekek WHERE id = ?", [item.id], (err, row) => {
      if (err) {
        errors.push({ id: item.id, error: err.message });
        return processItems(index + 1);
      }
      
      if (!row) {
        errors.push({ id: item.id, error: "Termék nem található" });
        return processItems(index + 1);
      }
      
      const ujKeszlet = row.keszlet - item.mennyiseg;
      
      if (ujKeszlet < 0) {
        errors.push({ id: item.id, nev: row.nev, error: `Nincs elegendő készlet! (csak ${row.keszlet} db van)` });
        return processItems(index + 1);
      }
      
      db.run("UPDATE termekek SET keszlet = ? WHERE id = ?", [ujKeszlet, item.id], function(err) {
        if (err) {
          errors.push({ id: item.id, error: err.message });
        } else {
          updates.push({ id: item.id, nev: row.nev, ujKeszlet, csokkentes: item.mennyiseg });
          console.log(`[KÉSZLET] ID ${item.id} (${row.nev}) új készlet: ${ujKeszlet} db (-${item.mennyiseg})`);
        }
        processItems(index + 1);
      });
    });
  };
  
  processItems(0);
});

// Készlet lekérdezése
app.get("/api/keszlet/:id", (req, res) => {
  const id = req.params.id;
  console.log(`[KÉSZLET] Lekérdezés ID: ${id}`);
  
  db.get("SELECT id, nev, keszlet FROM termekek WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: "Termék nem található" });
    }
    res.json({ success: true, keszlet: row.keszlet, nev: row.nev });
  });
});

// Összes termék készletének lekérdezése
app.get("/api/keszlet/osszes", (req, res) => {
  console.log('[KÉSZLET] Összes termék készletének lekérdezése');
  
  db.all("SELECT id, nev, keszlet FROM termekek ORDER BY nev", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, termekek: rows });
  });
});

// ==================== ADMIN VEGPONTOK ====================

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend mukodik" });
});

app.get("/api/admin/users", (req, res) => {
  console.log('[GET] Admin: felhasznalok listazasa');
  db.all("SELECT id, username, email, role, status FROM users ORDER BY id", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`[GET] ${rows.length} felhasznalo kuldve`);
    res.json(rows);
  });
});

app.delete("/api/admin/users/:id", (req, res) => {
  const { id } = req.params;
  console.log(`[DELETE] Admin: felhasznalo torlese ID: ${id}`);

  db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
    if (err) {
      console.error(`[DELETE] Hiba: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Felhasznalo nem talalhato" });
    }
    console.log(`[DELETE] SIKERES: Felhasznalo ID ${id} torolve`);
    res.json({ success: true, message: "Felhasznalo torolve" });
  });
});

app.put("/api/admin/users/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  console.log(`[PUT] Admin: felhasznalo statusz modositasa ID: ${id} -> ${status}`);

  if (!['active', 'banned'].includes(status)) {
    return res.status(400).json({ error: "Ervenytelen statusz! (active / banned)" });
  }

  db.run("UPDATE users SET status = ? WHERE id = ?", [status, id], function(err) {
    if (err) {
      console.error(`[PUT] Hiba: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Felhasznalo nem talalhato" });
    }
    console.log(`[PUT] SIKERES: Felhasznalo ID ${id} statusza: ${status}`);
    res.json({ success: true, message: "Statusz frissitve", status });
  });
});

app.put("/api/admin/users/:id/role", (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  console.log(`[PUT] Admin: szerepkor modositasa ID: ${id} -> ${role}`);

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: "Ervenytelen szerepkor! (user / admin)" });
  }

  db.run("UPDATE users SET role = ? WHERE id = ?", [role, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Felhasznalo nem talalhato" });
    console.log(`[PUT] SIKERES: Felhasznalo ID ${id} szerepkore: ${role}`);
    res.json({ success: true, message: "Szerepkor frissitve", role });
  });
});

// ==================== SZERVER INDITASA ====================

app.listen(PORT, () => {
  console.log(`\nBackend szerver fut: http://localhost:${PORT}`);
  console.log(` Termekek: http://localhost:${PORT}/termekek`);
  console.log(` Készlet lekérdezés: http://localhost:${PORT}/api/keszlet/osszes`);
  console.log(` Teszt: http://localhost:${PORT}/api/test`);
  console.log(` Felhasznalok: http://localhost:${PORT}/api/users`);
  console.log(` Bejelentkezes: admin@admin.com / admin123`);
  console.log(` Regisztracio: POST /api/register`);
  console.log(`\n A terminalban latod a bejelentkezeseket es a muveleteket`);
  console.log(`   Új regisztracio eseten a terminal kiirja az osszes felhasznalot`);
  console.log(`\n Készletkezelés végpontok:`);
  console.log(`   POST /api/keszlet/csokkent - Termék készletének módosítása (+ = csökken, - = nő)`);
  console.log(`   POST /api/keszlet/tomeges-csokkent - Több termék készletének csökkentése`);
  console.log(`   GET /api/keszlet/:id - Egy termék készletének lekérdezése`);
  console.log(`   GET /api/keszlet/osszes - Összes termék készletének lekérdezése\n`);
});