const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const GOOGLE_MAPS_API_KEY = 'AIzaSyB3q6E9VqjZqZqZqZqZqZqZqZqZqZqZqZqZq';

// ==================== DINAMIKUS CORS ====================
// Engedélyezett eredetek - bármilyen localhost portot elfogad
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175'
];

// Dinamikus CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Fejlesztéshez bármilyen localhost portot engedélyezünk
      if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Uploads mappa
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ==================== MULTER ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype));
  } 
});

// ==================== ADATBÁZIS - EGYSZERŰ KAPCSOLAT ====================
const dbPath = path.join(__dirname, 'webshopretrog.db');

// Ha létezik az adatbázis, töröljük a WAL fájlokat (zárolás feloldása)
try {
  if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
  if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
} catch(e) {}

const db = new sqlite3.Database(dbPath);

// WAL mód bekapcsolása - azonnal
db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA busy_timeout = 30000;");
db.run("PRAGMA synchronous = NORMAL;");

console.log('SQLite adatbázis csatlakoztatva');

// ==================== ADATBÁZIS SEGÉDFÜGGVÉNYEK ====================
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
    // Users tábla
    await dbRun(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active'
    )`);

    // Számlázási címek tábla
    await dbRun(`CREATE TABLE IF NOT EXISTS szamlazasi_cimek (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nev TEXT NOT NULL,
      email TEXT NOT NULL,
      telefon TEXT NOT NULL,
      iranyitoszam TEXT,
      varos TEXT,
      cim TEXT,
      adoszam TEXT,
      cegnev TEXT,
      user_id INTEGER,
      letrehozva DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Szállítási címek tábla
    await dbRun(`CREATE TABLE IF NOT EXISTS szallitasi_cimek (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      iranyitoszam TEXT,
      varos TEXT,
      cim TEXT,
      user_id INTEGER,
      letrehozva DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Rendelések tábla
    await dbRun(`CREATE TABLE IF NOT EXISTS rendelesek (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rendeles_szam TEXT UNIQUE,
      szallitas_mod TEXT NOT NULL,
      szallitas_pont TEXT,
      szallitas_pont_nev TEXT,
      szallitas_pont_cim TEXT,
      szallitas_pont_lat REAL,
      szallitas_pont_lng REAL,
      szamlazasi_cim_id INTEGER NOT NULL,
      szallitasi_cim_id INTEGER NOT NULL,
      reszosszeg REAL NOT NULL,
      szallitas_koltseg REAL NOT NULL,
      vegosszeg REAL NOT NULL,
      statusz TEXT DEFAULT 'fizetes_folyamatban',
      fizetes_mod TEXT,
      fizetes_statusz TEXT DEFAULT 'fuggo',
      user_id INTEGER,
      letrehozva DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Rendelési tételek tábla
    await dbRun(`CREATE TABLE IF NOT EXISTS rendeles_tetelek (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rendeles_id INTEGER NOT NULL,
      termek_id INTEGER NOT NULL,
      termek_nev TEXT NOT NULL,
      termek_ar REAL NOT NULL,
      mennyiseg INTEGER NOT NULL
    )`);

    // Fizetések tábla
    await dbRun(`CREATE TABLE IF NOT EXISTS fizetesek (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rendeles_id INTEGER NOT NULL,
      fizetes_mod TEXT NOT NULL,
      fizetes_osszeg REAL NOT NULL,
      statusz TEXT DEFAULT 'folyamatban',
      barion_fizetes_id TEXT,
      fizetes_id TEXT UNIQUE,
      letrehozva DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Átvételi pontok tábla
    await dbRun(`CREATE TABLE IF NOT EXISTS atveteli_pontok (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      szallitas_mod TEXT NOT NULL,
      nev TEXT NOT NULL,
      cim TEXT NOT NULL,
      varos TEXT,
      iranyitoszam TEXT,
      lat REAL,
      lng REAL,
      aktiv BOOLEAN DEFAULT 1
    )`);

    // Termékek tábla
    await dbRun(`CREATE TABLE IF NOT EXISTS termekek (
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

    // Átvételi pontok beszúrása (ha nincsenek)
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
      console.log('✅ Átvételi pontok beszúrva');
    }

    // ==================== FELHASZNÁLÓK UPSERT ====================
    const users = [
      { username: 'Teszt admin', email: 'admin@admin.com', password: 'admin123', role: 'admin', status: 'active' },
      { username: 'Peti admin', email: 'peti.admin@test.com', password: 'admin123', role: 'admin', status: 'active' },
      { username: 'Garmadaddy', email: 'Garm@gmail.com', password: 'Ga123456789', role: 'admin', status: 'active' },
      { username: 'Teszt user', email: 'user@test.com', password: 'user123', role: 'user', status: 'active' },
      { username: 'Gyula', email: 'gyulaszondi@citromail.hu', password: 'gyulivok22', role: 'user', status: 'active' }
    ];

    for (const user of users) {
      const existing = await dbGet("SELECT id FROM users WHERE email = ?", [user.email]);
      
      if (existing) {
        await dbRun(`UPDATE users SET username = ?, password = ?, role = ?, status = ? WHERE email = ?`,
          [user.username, user.password, user.role, user.status, user.email]);
        console.log(`🔄 Felhasználó frissítve: ${user.username} (${user.email})`);
      } else {
        await dbRun(`INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)`,
          [user.username, user.email, user.password, user.role, user.status]);
        console.log(`✅ Új felhasználó beszúrva: ${user.username} (${user.email})`);
      }
    }

    // Az összes felhasználó kilistázása a konzolra
    const allUsers = await dbAll("SELECT id, username, email, role, status FROM users ORDER BY id");
    console.log('\n=== REGISZTRÁLT FELHASZNÁLÓK ===');
    allUsers.forEach(user => {
      console.log(`ID: ${user.id} | ${user.username} | ${user.email} | Szerep: ${user.role} | Státusz: ${user.status}`);
    });
    console.log('================================\n');

    console.log('✅ Adatbázis inicializálás kész');
  } catch (err) {
    console.error('Inicializálási hiba:', err);
  }
}

// Inicializálás indítása késleltetéssel
setTimeout(() => {
  initializeDatabase();
}, 500);

// ==================== GOOGLE MAPS API VÉGPONT ====================
app.get("/api/google-maps-key", (req, res) => {
  res.json({ key: GOOGLE_MAPS_API_KEY });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend működik" });
});

// ==================== AUTH VÉGPONTOK ====================

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(`[LOGIN] Kísérlet: ${username}`);
  
  try {
    const user = await dbGet("SELECT * FROM users WHERE email = ?", [username]);
    if (!user) {
      console.log(`[LOGIN] Sikertelen: felhasználó nem található`);
      return res.status(401).json({ success: false, error: "Hibás email vagy jelszó!" });
    }
    if (user.password !== password) {
      console.log(`[LOGIN] Sikertelen: rossz jelszó`);
      return res.status(401).json({ success: false, error: "Hibás email vagy jelszó!" });
    }
    if (user.status === 'banned') {
      console.log(`[LOGIN] Sikertelen: felhasználó tiltva`);
      return res.status(403).json({ success: false, error: "Felhasználó ki van tiltva!" });
    }
    console.log(`[LOGIN] Sikeres: ${user.username} (${user.role})`);
    res.json({ 
      success: true, 
      token: `token-${user.id}-${Date.now()}`, 
      user: { id: user.id, username: user.username, email: user.email, role: user.role } 
    });
  } catch (err) {
    console.error('[LOGIN] Hiba:', err);
    res.status(500).json({ success: false, error: "Szerver hiba" });
  }
});

app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: "Minden mező kötelező!" });
  }
  
  try {
    const existing = await dbGet("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) {
      return res.status(400).json({ success: false, error: "Az email már létezik!" });
    }
    const result = await dbRun("INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, 'user', 'active')", 
      [username, email, password]);
    console.log(`[REGISTER] Új felhasználó: ${username} (${email})`);
    res.json({ success: true, message: "Sikeres regisztráció!", user: { id: result.lastID, username, email, role: "user" } });
  } catch (err) {
    console.error('[REGISTER] Hiba:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== TERMÉK VÉGPONTOK ====================

app.get("/termekek", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM termekek ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/termekek/:id", async (req, res) => {
  try {
    const row = await dbGet("SELECT * FROM termekek WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ message: "Termék nem található" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/termekek", upload.single('kep'), async (req, res) => {
  const { nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, keszlet } = req.body;
  
  if (!nev || !ar) return res.status(400).json({ message: "Név és ár kötelező!" });
  
  const kepUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
  try {
    const result = await dbRun(`INSERT INTO termekek (nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, kep, keszlet)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nev, ar, allapot || null, evjarat || null, gyarto || null, arus || null, termekTipus || null, leiras || null, kepUrl, keszlet || 0]);
    res.json({ success: true, message: "Termék mentve!", termekId: result.lastID, kep: kepUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/termekek/:id", upload.single('kep'), async (req, res) => {
  const id = req.params.id;
  const { nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, keszlet } = req.body;
  
  let kepUrl = null;
  if (req.file) kepUrl = `/uploads/${req.file.filename}`;
  
  const params = kepUrl
    ? [nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, keszlet || 0, kepUrl, id]
    : [nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, keszlet || 0, id];
  const sql = kepUrl
    ? `UPDATE termekek SET nev=?, ar=?, allapot=?, evjarat=?, gyarto=?, arus=?, termekTipus=?, leiras=?, keszlet=?, kep=? WHERE id=?`
    : `UPDATE termekek SET nev=?, ar=?, allapot=?, evjarat=?, gyarto=?, arus=?, termekTipus=?, leiras=?, keszlet=? WHERE id=?`;
  
  try {
    const result = await dbRun(sql, params);
    if (result.changes === 0) return res.status(404).json({ message: "Termék nem található" });
    const row = await dbGet("SELECT * FROM termekek WHERE id = ?", [id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/termekek/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const row = await dbGet("SELECT kep FROM termekek WHERE id = ?", [id]);
    const result = await dbRun("DELETE FROM termekek WHERE id = ?", [id]);
    if (result.changes === 0) return res.status(404).json({ message: "Termék nem található" });
    if (row && row.kep) {
      const kepPath = path.join(__dirname, row.kep);
      if (fs.existsSync(kepPath)) fs.unlinkSync(kepPath);
    }
    res.json({ success: true, message: "Termék törölve" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== KÉSZLET KEZELÉS VÉGPONTOK ====================

app.get("/api/keszlet/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const row = await dbGet("SELECT id, nev, keszlet FROM termekek WHERE id = ?", [id]);
    if (!row) return res.status(404).json({ success: false, message: "Termék nem található", keszlet: 0 });
    res.json({ success: true, keszlet: row.keszlet, nev: row.nev });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/keszlet/csokkent", async (req, res) => {
  const { termekId, mennyiseg } = req.body;
  console.log(`[KÉSZLET] Módosítás: termék ${termekId}, változás: ${mennyiseg}`);
  
  if (!termekId || mennyiseg === undefined) {
    return res.status(400).json({ success: false, message: "Érvénytelen paraméterek!" });
  }
  if (mennyiseg === 0) {
    return res.json({ success: true, message: "Nincs változás" });
  }
  
  try {
    const row = await dbGet("SELECT keszlet, nev FROM termekek WHERE id = ?", [termekId]);
    if (!row) {
      return res.status(404).json({ success: false, message: "Termék nem található!" });
    }
    
    let ujKeszlet = row.keszlet - mennyiseg;
    if (mennyiseg > 0 && ujKeszlet < 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Nincs elegendő készlet! (${row.nev} - csak ${row.keszlet} db van)` 
      });
    }
    
    await dbRun("UPDATE termekek SET keszlet = ? WHERE id = ?", [ujKeszlet, termekId]);
    console.log(`[KÉSZLET] Sikeres: ${row.nev} ${row.keszlet} -> ${ujKeszlet} db`);
    res.json({ success: true, ujKeszlet, message: "Sikeres módosítás" });
  } catch (err) {
    console.error('[KÉSZLET] Hiba:', err);
    res.status(500).json({ success: false, error: err.message, message: err.message });
  }
});

app.get("/api/keszlet/osszes", async (req, res) => {
  try {
    const rows = await dbAll("SELECT id, nev, keszlet FROM termekek ORDER BY nev");
    res.json({ success: true, termekek: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== SZÁMLÁZÁSI ÉS SZÁLLÍTÁSI VÉGPONTOK ====================

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

// ==================== RENDELÉS VÉGPONTOK ====================

app.post("/api/rendeles", async (req, res) => {
  const { szallitasMod, szallitasPont, szallitasPontNev, szallitasPontCim,
    szallitasPontLat, szallitasPontLng, szamlazasiCimId, szallitasiCimId,
    termekek, reszosszeg, szallitasKoltseg, vegosszeg, fizetesMod, user_id } = req.body;
  
  console.log(`[RENDELÉS] Új rendelés: ${termekek?.length} tétel, Összeg: ${vegosszeg} Ft`);
  
  if (!termekek || termekek.length === 0) {
    return res.status(400).json({ success: false, error: "A rendelés nem tartalmaz termékeket!" });
  }
  
  const rendelesSzam = `REND-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  try {
    // frissitve NÉLKÜL
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
    console.error('[RENDELÉS] Hiba:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== ÁTVÉTELI PONTOK VÉGPONT ====================

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

// ==================== FIZETÉS VÉGPONTOK ====================

app.post("/api/fizetes/utanvetel", async (req, res) => {
  const { rendelesId, osszeg, fizetesMod } = req.body;
  if (!rendelesId) return res.status(400).json({ success: false, error: "Hiányzó rendelés ID!" });
  
  const fizetesId = `FIZ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  try {
    await dbRun(`INSERT INTO fizetesek (rendeles_id, fizetes_mod, fizetes_osszeg, statusz, fizetes_id) VALUES (?, ?, ?, 'fuggo', ?)`,
      [rendelesId, fizetesMod, osszeg, fizetesId]);
    await dbRun(`UPDATE rendelesek SET fizetes_statusz = 'fuggo', fizetes_mod = ? WHERE id = ?`, [fizetesMod, rendelesId]);
    res.json({ success: true, fizetesId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/barion/start-payment", async (req, res) => {
  const { rendelesId, rendelesSzam, osszeg, fizetesMod } = req.body;
  const fizetesId = `FIZ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  try {
    await dbRun(`INSERT INTO fizetesek (rendeles_id, fizetes_mod, fizetes_osszeg, statusz, fizetes_id) VALUES (?, ?, ?, 'folyamatban', ?)`,
      [rendelesId, fizetesMod, osszeg, fizetesId]);
    const mockPaymentUrl = `https://sandbox.barion.com/pay?orderId=${rendelesSzam}&amount=${osszeg}`;
    res.json({ success: true, fizetesiUrl: mockPaymentUrl, fizetesId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== BARION FIZETÉS VISSZAIGAZOLÁS ====================
app.post("/api/barion/payment-success", async (req, res) => {
  const { rendelesId, rendelesSzam, paymentId, osszeg, cardLast4, cardName, fizetesMod } = req.body;
  
  console.log(`[BARION] Fizetés sikeres: ${rendelesSzam}, PaymentID: ${paymentId}, Összeg: ${osszeg} Ft`);
  
  if (!rendelesId || !paymentId) {
    return res.status(400).json({ success: false, error: "Hiányzó paraméterek!" });
  }
  
  try {
    // Ellenőrizzük és hozzáadjuk a hiányzó oszlopokat
    const tableInfo = await dbAll("PRAGMA table_info(fizetesek)");
    const columns = tableInfo.map(c => c.name);
    
    if (!columns.includes('barion_fizetes_id')) {
      await dbRun("ALTER TABLE fizetesek ADD COLUMN barion_fizetes_id TEXT");
      console.log('[BARION] barion_fizetes_id oszlop hozzáadva');
    }
    
    if (!columns.includes('fizetes_id')) {
      await dbRun("ALTER TABLE fizetesek ADD COLUMN fizetes_id TEXT");
      console.log('[BARION] fizetes_id oszlop hozzáadva');
    }
    
    if (!columns.includes('frissitve')) {
      await dbRun("ALTER TABLE fizetesek ADD COLUMN frissitve DATETIME");
      console.log('[BARION] frissitve oszlop hozzáadva');
    }
    
    // létezik-e már fizetés ehhez a rendeléshez
    const existingPayment = await dbGet("SELECT id FROM fizetesek WHERE rendeles_id = ? AND fizetes_mod = 'bankkartya'", [rendelesId]);
    
    if (existingPayment) {
      // Meglévő fizetés frissítése
      await dbRun(`UPDATE fizetesek SET statusz = 'fizetve', barion_fizetes_id = ?, frissitve = CURRENT_TIMESTAMP WHERE rendeles_id = ? AND fizetes_mod = 'bankkartya'`,
        [paymentId, rendelesId]);
      console.log(`[BARION] Meglévő fizetés frissítve: ${rendelesId}`);
    } else {
      // Új fizetés beszúrása
      const fizetesId = `BARION-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await dbRun(`INSERT INTO fizetesek (rendeles_id, fizetes_mod, fizetes_osszeg, statusz, barion_fizetes_id, fizetes_id, frissitve) VALUES (?, ?, ?, 'fizetve', ?, ?, CURRENT_TIMESTAMP)`,
        [rendelesId, fizetesMod, osszeg, paymentId, fizetesId]);
      console.log(`[BARION] Új fizetés beszúrva: ${rendelesId}`);
    }
    
    // Frissítsük a rendelés státuszát
    await dbRun(`UPDATE rendelesek SET fizetes_statusz = 'fizetve', statusz = 'fizetve' WHERE id = ?`, [rendelesId]);
    
    console.log(`[BARION] Rendelés #${rendelesId} státusz frissítve: fizetve`);
    res.json({ success: true, message: "Fizetés sikeresen rögzítve", rendelesId: rendelesId });
    
  } catch (err) {
    console.error('[BARION] Hiba:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== ADMIN VÉGPONTOK ====================

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

// ==================== RENDELÉSEK LEKÉRDEZÉSE ====================
app.get("/api/rendelesek", async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT r.*, u.username as user_nev 
      FROM rendelesek r 
      LEFT JOIN users u ON r.user_id = u.id 
      ORDER BY r.letrehozva DESC
    `);
    console.log(`[RENDELÉSEK] ${rows.length} rendelés küldve`);
    res.json(rows);
  } catch (err) {
    console.error('[RENDELÉSEK] Hiba:', err.message);
    res.status(500).json({ error: err.message });
  }
});
// ==================== RENDELÉS STÁTUSZ MÓDOSÍTÁS ====================
app.put("/api/rendeles/:id/statusz", async (req, res) => {
  const { id } = req.params;
  const { statusz } = req.body;
  
  console.log(`[STÁTUSZ] Rendelés ${id} státusz módosítása -> ${statusz}`);
  
  const validStatuszok = ['fizetes_folyamatban', 'fizetve', 'feldolgozas_alatt', 'szallitva', 'teljesitve', 'torolve'];
  if (!validStatuszok.includes(statusz)) {
    return res.status(400).json({ error: "Érvénytelen státusz!" });
  }
  
  try {
    const result = await dbRun("UPDATE rendelesek SET statusz = ? WHERE id = ?", [statusz, id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Rendelés nem található" });
    }
    
    console.log(`[STÁTUSZ] Sikeresen frissítve: ${id} -> ${statusz}`);
    res.json({ success: true, statusz });
  } catch (err) {
    console.error('[STÁTUSZ] Hiba:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== FIZETÉSEK LEKÉRDEZÉSE (ADMIN) ====================
app.get("/api/admin/fizetesek", async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT f.*, r.rendeles_szam, r.vegosszeg as rendeles_osszeg 
      FROM fizetesek f 
      JOIN rendelesek r ON f.rendeles_id = r.id 
      ORDER BY f.letrehozva DESC
    `);
    console.log(`[FIZETÉSEK] ${rows.length} fizetés küldve`);
    res.json(rows);
  } catch (err) {
    console.error('[FIZETÉSEK] Hiba:', err.message);
    res.status(500).json({ error: err.message });
  }
});
// ==================== FIZETÉS LÉTREHOZÁSA RENDELÉSBŐL ====================
app.post("/api/fizetes/create-from-rendeles", async (req, res) => {
  const { rendelesId, osszeg, fizetesMod } = req.body;
  
  console.log(`[FIZETÉS] Létrehozás rendelésből: ${rendelesId}, Összeg: ${osszeg} Ft`);
  
  if (!rendelesId) {
    return res.status(400).json({ success: false, error: "Hiányzó rendelés ID!" });
  }
  
  try {
    // Ellenőrizzük, hogy létezik-e már fizetés
    const existing = await dbGet("SELECT id FROM fizetesek WHERE rendeles_id = ?", [rendelesId]);
    
    if (existing) {
      return res.json({ success: true, message: "Fizetés már létezik", fizetesId: existing.id });
    }
    
    const fizetesId = `FIZ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    await dbRun(`INSERT INTO fizetesek (rendeles_id, fizetes_mod, fizetes_osszeg, statusz, fizetes_id) VALUES (?, ?, ?, 'fizetve', ?)`,
      [rendelesId, fizetesMod, osszeg, fizetesId]);
    
    console.log(`[FIZETÉS] Új fizetés létrehozva: ${fizetesId}`);
    res.json({ success: true, fizetesId });
    
  } catch (err) {
    console.error('[FIZETÉS] Hiba:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== SZERVER INDÍTÁSA ====================
app.listen(PORT, () => {
  console.log(`\n✅ Backend szerver fut: http://localhost:${PORT}`);
  console.log(`🌍 CORS engedélyezve: localhost bármely portjáról`);
  console.log(`👤 Teszt bejelentkezés: admin@admin.com / admin123`);
  console.log(`👤 További felhasználók: Garmadaddy / Ga123456789, Gyula / gyulivok22`);
  console.log(`\n📦 Végpontok elérhetők:\n`);
});