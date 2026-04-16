// backend/server.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;

// Middleware-ek
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statikus fájlok kiszolgálása (pl. feltöltött képek)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer beállítása fájl feltöltéshez
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Uploads mappa létrehozása, ha nem létezik
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// POST /termekek végpont - fájl feltöltéssel
app.post('/termekek', upload.single('kep'), (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    const { nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras } = req.body;
    
    // Ellenőrizzük a kötelező mezőket
    if (!nev || !ar) {
      return res.status(400).json({ 
        message: 'Név és ár megadása kötelező!' 
      });
    }
    
    // Kép URL létrehozása, ha volt feltöltés
    const kepUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Itt mentsd el az adatokat az adatbázisba
    // Példa: const newTermek = { id: Date.now(), nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras, kep: kepUrl };
    
    res.status(201).json({ 
      message: 'Termék sikeresen hozzáadva!',
      termek: {
        nev,
        ar,
        allapot,
        evjarat,
        gyarto,
        arus,
        termekTipus,
        leiras,
        kep: kepUrl
      }
    });
    
  } catch (error) {
    console.error('Hiba a termék mentésekor:', error);
    res.status(500).json({ 
      message: 'Szerver hiba történt!',
      error: error.message 
    });
  }
});

// Egyéb végpontok (GET, PUT, DELETE stb.)
app.get('/termekek', (req, res) => {
  // Itt listázd a termékeket
  res.json({ termekek: [] });
});

app.listen(PORT, () => {
  console.log(`Backend szerver fut a http://localhost:${PORT} címen`);
});