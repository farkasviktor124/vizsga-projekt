import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// KEZDŐOLDAL
app.get('/', (req, res) => {
    res.send(`
        <h1>🎮 Retro G-Shop</h1>
        <p>Szerver fut: http://localhost:${PORT}</p>
        
        <h3>Végpontok:</h3>
        <ul>
            <li><a href="/api/users">GET /api/users</a> - Felhasználók</li>
            <li><a href="/api/products">GET /api/products</a> - Termékek</li>
            <li><a href="/api/ads">GET /api/ads</a> - Hirdetések</li>
            <li>POST /api/register - Regisztráció</li>
            <li>POST /api/login - Bejelentkezés</li>
        </ul>
    `);
});

// FELHASZNÁLÓK
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.felhasznalok.findMany({
            select: {
                ID: true,
                Email: true,
                Vezeteknev: true,
                Keresztnev: true
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// REGISZTRÁCIÓ
app.post('/api/register', async (req, res) => {
    try {
        const { email, vezeteknev, keresztnev, jelszo } = req.body;
        
        const hashedPassword = await bcrypt.hash(jelszo, 10);
        
        const user = await prisma.felhasznalok.create({
            data: {
                Email: email,
                Vezeteknev: vezeteknev,
                Keresztnev: keresztnev,
                Jelszo: hashedPassword,
                Jogosultsag: 2
            }
        });
        
        const token = jwt.sign(
            { userId: user.ID },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Sikeres regisztráció!',
            userId: user.ID,
            token
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// TERMÉKEK
app.get('/api/products', async (req, res) => {
    try {
        const products = await prisma.termekek.findMany();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// HIRDETÉSEK
app.get('/api/ads', async (req, res) => {
    try {
        const ads = await prisma.hirdetes.findMany({
            include: {
                termekek: true,
                felhasznalok: {
                    select: {
                        Vezeteknev: true,
                        Keresztnev: true
                    }
                }
            }
        });
        res.json(ads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// SZERVER INDÍTÁSA
app.listen(PORT, () => {
    console.log(`🎮 Retro GSHop fut: http://localhost:${PORT}`);
});