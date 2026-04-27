const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const GOOGLE_MAPS_API_KEY = 'AIzaSyB3q6E9VqjZqZqZqZqZqZqZqZqZqZqZqZqZq';

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Uploads mappa
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  cb(null, allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype));
} });

// ==================== ADATBÁZIS KEZELŐ - EGYSZERŰ, NEM ZÁRÓDÓ KAPCSOLAT ====================
const dbPath = path.join(__dirname, 'webshopretrog.db');

// EGYETLEN globális kapcsolat - ez megoldja a locking problémát!
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Adatbázis hiba:', err.message);
    process.exit(1);
  }
  console.log('SQLite adatbázis csatlakoztatva');
  
  // WAL mód bekapcsolása - ez a KULCS a locking megszüntetéséhez
  db.run("PRAGMA journal_mode = WAL;");
  db.run("PRAGMA busy_timeout = 30000;");
  db.run("PRAGMA synchronous = NORMAL;");
  
  initializeDatabase();
});

// Adatbázis műveletek - PROMISE wrapper
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// ==================== ADATBÁZIS INICIALIZÁLÁS ====================
async function initializeDatabase() {
  try {
    // Táblák létrehozása
    await dbRun(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, email TEXT UNIQUE,
      password TEXT, role TEXT DEFAULT 'user', status TEXT DEFAULT 'active'
    )`);
    
    await dbRun(`CREATE TABLE IF NOT EXISTS szamlazasi_cimek (
      id INTEGER PRIMARY KEY AUTOINCREMENT, nev TEXT NOT NULL, email TEXT NOT NULL,
      telefon TEXT NOT NULL, iranyitoszam TEXT, varos TEXT, cim TEXT,
      adoszam TEXT, cegnev TEXT, user_id INTEGER, letrehozva DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    await dbRun(`CREATE TABLE IF NOT EXISTS szallitasi_cimek (
      id INTEGER PRIMARY KEY AUTOINCREMENT, iranyitoszam TEXT, varos TEXT, cim TEXT,
      user_id INTEGER, letrehozva DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    await dbRun(`CREATE TABLE IF NOT EXISTS rendelesek (
      id INTEGER PRIMARY KEY AUTOINCREMENT, rendeles_szam TEXT UNIQUE,
      szallitas_mod TEXT NOT NULL, szallitas_pont TEXT, szallitas_pont_nev TEXT,
      szallitas_pont_cim TEXT, szallitas_pont_lat REAL, szallitas_pont_lng REAL,
      szamlazasi_cim_id INTEGER NOT NULL, szallitasi_cim_id INTEGER NOT NULL,
      reszosszeg REAL NOT NULL, szallitas_koltseg REAL NOT NULL, vegosszeg REAL NOT NULL,
      statusz TEXT DEFAULT 'fizetes_folyamatban', fizetes_mod TEXT,
      fizetes_statusz TEXT DEFAULT 'fuggo', user_id INTEGER, letrehozva DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    await dbRun(`CREATE TABLE IF NOT EXISTS rendeles_tetelek (
      id INTEGER PRIMARY KEY AUTOINCREMENT, rendeles_id INTEGER NOT NULL,
      termek_id INTEGER NOT NULL, termek_nev TEXT NOT NULL, termek_ar REAL NOT NULL,
      mennyiseg INTEGER NOT NULL
    )`);
    
    await dbRun(`CREATE TABLE IF NOT EXISTS fizetesek (
      id INTEGER PRIMARY KEY AUTOINCREMENT, rendeles_id INTEGER NOT NULL,
      fizetes_mod TEXT NOT NULL, fizetes_osszeg REAL NOT NULL,
      statusz TEXT DEFAULT 'folyamatban', barion_fizetes_id TEXT,
      fizetes_id TEXT UNIQUE, letrehozva DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    await dbRun(`CREATE TABLE IF NOT EXISTS atveteli_pontok (
      id INTEGER PRIMARY KEY AUTOINCREMENT, szallitas_mod TEXT NOT NULL,
      nev TEXT NOT NULL, cim TEXT NOT NULL, varos TEXT, iranyitoszam TEXT,
      lat REAL, lng REAL, aktiv BOOLEAN DEFAULT 1
    )`);
    
    await dbRun(`CREATE TABLE IF NOT EXISTS termekek (
      id INTEGER PRIMARY KEY AUTOINCREMENT, nev TEXT NOT NULL, ar REAL NOT NULL,
      allapot TEXT, evjarat INTEGER, gyarto TEXT, arus TEXT, termekTipus TEXT,
      leiras TEXT, kep TEXT, keszlet INTEGER DEFAULT 0
    )`);
    
    // Oszlopok ellenőrzése
    const termekekInfo = await dbAll("PRAGMA table_info(termekek)");
    const termekekCols = termekekInfo.map(r => r.name);
    if (!termekekCols.includes('termekTipus')) await dbRun("ALTER TABLE termekek ADD COLUMN termekTipus TEXT");
    if (!termekekCols.includes('leiras')) await dbRun("ALTER TABLE termekek ADD COLUMN leiras TEXT");
    if (!termekekCols.includes('kep')) await dbRun("ALTER TABLE termekek ADD COLUMN kep TEXT");
    if (!termekekCols.includes('keszlet')) await dbRun("ALTER TABLE termekek ADD COLUMN keszlet INTEGER DEFAULT 0");
    
    const usersInfo = await dbAll("PRAGMA table_info(users)");
    const usersCols = usersInfo.map(r => r.name);
    if (!usersCols.includes('role')) await dbRun("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
    if (!usersCols.includes('status')) await dbRun("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
    
    // Átvételi pontok beszúrása
    const pontCount = await dbGet("SELECT COUNT(*) as count FROM atveteli_pontok");
    if (pontCount.count === 0) {
      const pontok = [
        ['gls_automata', 'GLS Automata - Aréna Pláza', 'Budapest, Kerepesi út 9.', 'Budapest', '1087', 47.4979, 19.0402],
        ['gls_automata', 'GLS Automata - WestEnd', 'Budapest, Váci út 1-3.', 'Budapest', '1062', 47.5142, 19.0542],
        ['gls_automata', 'GLS Automata - Árkád', 'Budapest, Örs vezér tere 25.', 'Budapest', '1106', 47.5034, 19.1383],
        ['gls_automata', 'GLS Automata - Debrecen Fórum', 'Debrecen, Csapó utca 30.', 'Debrecen', '4029', 47.5316, 21.6273],
        ['gls_automata', 'GLS Automata - Szeged Árkád', 'Szeged, Csillag tér 2.', 'Szeged', '6720', 46.2530, 20.1484],
        ['gls_automata', 'GLS Automata - Győr Pláza', 'Győr, Budai út 1.', 'Győr', '9027', 47.6875, 17.6504],
        ['gls_automata', 'GLS Automata - Miskolc Pláza', 'Miskolc, Szentpéteri kapu 2.', 'Miskolc', '3526', 48.1035, 20.7784],
        ['gls_automata', 'GLS Automata - Pécs Árkád', 'Pécs, Megyeri út 76.', 'Pécs', '7630', 46.0764, 18.2270],
        ['gls_pont', 'GLS Pont - XIII. ker', 'Budapest, Lehel utca 15.', 'Budapest', '1135', 47.5215, 19.0673],
        ['gls_pont', 'GLS Pont - XI. ker', 'Budapest, Fehérvári út 89.', 'Budapest', '1119', 47.4648, 19.0402],
        ['foxpost', 'Foxpost - WestEnd', 'Budapest, Váci út 1-3.', 'Budapest', '1062', 47.5142, 19.0542],
        ['foxpost', 'Foxpost - Aréna Pláza', 'Budapest, Kerepesi út 9.', 'Budapest', '1087', 47.4979, 19.0402],
        ['foxpost', 'Foxpost - Debrecen', 'Debrecen, Piac utca 50.', 'Debrecen', '4025', 47.5300, 21.6230],
        ['foxpost', 'Foxpost - Szeged', 'Szeged, Dugonics tér 12.', 'Szeged', '6720', 46.2520, 20.1500],
        ['packeta', 'Packeta - Allee', 'Budapest, Október huszonharmadika u. 8-10.', 'Budapest', '1117', 47.4700, 19.0500],
        ['packeta', 'Packeta - Debrecen', 'Debrecen, Csapó utca 2.', 'Debrecen', '4029', 47.5316, 21.6273],
        ['mpl', 'MPL Pont - Budapest', 'Budapest, Váci út 75.', 'Budapest', '1133', 47.5200, 19.0680],
        ['mpl', 'MPL Pont - Debrecen', 'Debrecen, Petőfi tér 3.', 'Debrecen', '4024', 47.5310, 21.6220],
        ['dpd', 'DPD Pickup - Budapest', 'Budapest, Váci út 49.', 'Budapest', '1134', 47.5180, 19.0600],
        ['dpd', 'DPD Pickup - Debrecen', 'Debrecen, Csapó utca 45.', 'Debrecen', '4029', 47.5320, 21.6280],
        ['expressone', 'Express One - Budapest', 'Budapest, Lehel utca 25.', 'Budapest', '1135', 47.5220, 19.0690],
        ['expressone', 'Express One - Debrecen', 'Debrecen, Kishatár út 5.', 'Debrecen', '4032', 47.5400, 21.6100]
      ];
      for (const p of pontok) {
        await dbRun(`INSERT INTO atveteli_pontok (szallitas_mod, nev, cim, varos, iranyitoszam, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)`, p);
      }
    }
    
    // Admin felhasználók
    const adminCount = await dbGet("SELECT COUNT(*) as count FROM users WHERE email = 'admin@admin.com'");
    if (adminCount.count === 0) {
      await dbRun("INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, 'admin', 'active')", 
        ['Teszt admin', 'admin@admin.com', 'admin123']);
      await dbRun("INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, 'admin', 'active')", 
        ['Peti admin', 'peti.admin@test.com', 'admin123']);
      await dbRun("INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, 'user', 'active')", 
        ['Teszt user', 'user@test.com', 'user123']);
    }
    
    console.log('✅ Adatbázis inicializálás kész');
  } catch (err) {
    console.error('Inicializálási hiba:', err);
  }
}

// ==================== API VÉGPONTOK ====================

app.get("/api/google-maps-key", (req, res) => {
  res.json({ key: GOOGLE_MAPS_API_KEY });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend működik" });
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await dbGet("SELECT * FROM users WHERE email = ?", [username]);
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, error: "Hibás email vagy jelszó!" });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ success: false, error: "Felhasználó ki van tiltva!" });
    }
    res.json({ success: true, token: `token-${user.id}-${Date.now()}`, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// REGISTER
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ success: false, error: "Minden mező kitöltése kötelező!" });
  try {
    const existing = await dbGet("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) return res.status(400).json({ success: false, error: "Az email már létezik!" });
    const result = await dbRun("INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, 'user', 'active')", [username, email, password]);
    res.json({ success: true, message: "Sikeres regisztráció!", user: { id: result.lastID, username, email, role: "user" } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// TERMÉKEK
app.get("/termekek", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM termekek ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TERMÉK FELVITELE
app.post("/termekek", upload.single('kep'), async (req, res) => {
  const { nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, keszlet } = req.body;
  
  console.log(`[POST] Új termék: ${nev}, Ár: ${ar}, Árus: ${arus}`);
  
  if (!nev || !ar) {
    return res.status(400).json({ message: "Név és ár kötelező!" });
  }
  
  if (isNaN(ar) || ar <= 0) {
    return res.status(400).json({ message: "Érvénytelen ár!" });
  }
  
  const kepUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
  try {
    const result = await dbRun(`INSERT INTO termekek (nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, kep, keszlet)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nev, ar, allapot || null, evjarat || null, gyarto || null, arus || null, termekTipus || null, leiras || null, kepUrl, keszlet || 0]);
    
    res.json({ success: true, message: "Termék mentve!", termekId: result.lastID, kep: kepUrl });
  } catch (err) {
    console.error('[POST] Hiba:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// RENDELÉSEK LEKÉRDEZÉSE
app.get("/api/rendelesek", async (req, res) => {
  try {
    const rows = await dbAll(`SELECT r.*, u.username as user_nev FROM rendelesek r LEFT JOIN users u ON r.user_id = u.id ORDER BY r.letrehozva DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STÁTUSZ MÓDOSÍTÁS
app.put("/api/rendeles/:id/statusz", async (req, res) => {
  const { id } = req.params;
  const { statusz } = req.body;
  
  const valid = ['fizetes_folyamatban', 'fizetve', 'feldolgozas_alatt', 'szallitva', 'teljesitve', 'torolve'];
  if (!valid.includes(statusz)) {
    return res.status(400).json({ error: "Érvénytelen státusz!" });
  }
  
  db.run("UPDATE rendelesek SET statusz = ? WHERE id = ?", [statusz, id], function(err) {
    if (err) {
      console.error('[STÁTUSZ] Hiba:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Rendelés nem található" });
    }
    console.log(`[STÁTUSZ] Sikeresen frissítve: ${id} -> ${statusz}`);
    res.json({ success: true, statusz });
  });
});
// ÁTVÉTELI PONTOK
app.get("/api/atveteli-pontok", async (req, res) => {
  const { szallitasMod } = req.query;
  if (!szallitasMod) return res.status(400).json({ error: "Szállítási mód megadása kötelező!" });
  try {
    const rows = await dbAll(`SELECT id, nev, cim, varos, iranyitoszam, lat, lng FROM atveteli_pontok WHERE szallitas_mod = ? AND aktiv = 1 ORDER BY nev`, [szallitasMod]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SZÁMLÁZÁSI CÍM
app.post("/api/szamlazasi-cim", async (req, res) => {
  const { nev, email, telefon, iranyitoszam, varos, cim, adoszam, cegnev, user_id } = req.body;
  if (!nev || !email || !telefon) return res.status(400).json({ success: false, error: "Név, email és telefon kötelező!" });
  try {
    const result = await dbRun(`INSERT INTO szamlazasi_cimek (nev, email, telefon, iranyitoszam, varos, cim, adoszam, cegnev, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nev, email, telefon, iranyitoszam || null, varos || null, cim || null, adoszam || null, cegnev || null, user_id || null]);
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SZÁLLÍTÁSI CÍM
app.post("/api/szallitasi-cim", async (req, res) => {
  const { iranyitoszam, varos, cim, user_id } = req.body;
  try {
    const result = await dbRun(`INSERT INTO szallitasi_cimek (iranyitoszam, varos, cim, user_id) VALUES (?, ?, ?, ?)`,
      [iranyitoszam || null, varos || null, cim || null, user_id || null]);
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// RENDELÉS MENTÉSE
app.post("/api/rendeles", async (req, res) => {
  const { szallitasMod, szallitasPont, szallitasPontNev, szallitasPontCim,
    szallitasPontLat, szallitasPontLng, szamlazasiCimId, szallitasiCimId,
    termekek, reszosszeg, szallitasKoltseg, vegosszeg, fizetesMod, user_id } = req.body;
  
  if (!termekek || termekek.length === 0) {
    return res.status(400).json({ success: false, error: "A rendelés nem tartalmaz termékeket!" });
  }
  
  const rendelesSzam = `REND-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  try {
    const result = await dbRun(`INSERT INTO rendelesek (rendeles_szam, szallitas_mod, szallitas_pont, szallitas_pont_nev, szallitas_pont_cim,
      szallitas_pont_lat, szallitas_pont_lng, szamlazasi_cim_id, szallitasi_cim_id,
      reszosszeg, szallitas_koltseg, vegosszeg, fizetes_mod, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [rendelesSzam, szallitasMod, szallitasPont || null, szallitasPontNev || null, szallitasPontCim || null,
       szallitasPontLat || null, szallitasPontLng || null, szamlazasiCimId, szallitasiCimId,
       reszosszeg, szallitasKoltseg, vegosszeg, fizetesMod || null, user_id || null]);
    
    const rendelesId = result.lastID;
    for (const termek of termekek) {
      const mennyiseg = termek.mennyiseg || termek.quantity || 1;
      await dbRun(`INSERT INTO rendeles_tetelek (rendeles_id, termek_id, termek_nev, termek_ar, mennyiseg) VALUES (?, ?, ?, ?, ?)`,
        [rendelesId, termek.id, termek.nev, termek.ar, mennyiseg]);
    }
    res.json({ success: true, id: rendelesId, rendelesSzam });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// FIZETÉSEK LEKÉRDEZÉSE (ADMIN)
app.get("/api/admin/fizetesek", async (req, res) => {
  try {
    const rows = await dbAll(`SELECT f.*, r.rendeles_szam, r.vegosszeg as rendeles_osszeg FROM fizetesek f JOIN rendelesek r ON f.rendeles_id = r.id ORDER BY f.letrehozva DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN FELHASZNÁLÓK
app.get("/api/admin/users", async (req, res) => {
  try {
    const rows = await dbAll("SELECT id, username, email, role, status FROM users ORDER BY id");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    await dbRun("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/users/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!['active', 'banned'].includes(status)) return res.status(400).json({ error: "Érvénytelen státusz!" });
  try {
    await dbRun("UPDATE users SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/users/:id/role", async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: "Érvénytelen szerepkör!" });
  try {
    await dbRun("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SZERVER INDÍTÁSA ====================
app.listen(PORT, () => {
  console.log(`\n✅ Backend szerver fut: http://localhost:${PORT}`);
  console.log(`👤 Teszt bejelentkezés: admin@admin.com / admin123\n`);
});