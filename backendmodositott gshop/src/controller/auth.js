import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';


export const register = async (req, res) => {
    try {
        const { email, vezeteknev, keresztnev, jelszo } = req.body;
        
        
        if (!email || !vezeteknev || !keresztnev || !jelszo) {
            return res.status(400).json({ 
                error: 'Minden mező kitöltése kötelező!' 
            });
        }
        
       
        const existingUser = await prisma.felhasznalok.findUnique({
            where: { Email: email }
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                error: 'Ez az email cím már regisztrálva van!' 
            });
        }
        
     
        const hashedPassword = await bcrypt.hash(jelszo, 10);
        
        // Felhasználó létrehozása
        const newUser = await prisma.felhasznalok.create({
            data: {
                Email: email,
                Vezeteknev: vezeteknev,
                Keresztnev: keresztnev,
                Jelszo: hashedPassword,
                Jogosultsag: 2 // Alapértelmezett: Felhasználó
            }
        });
        
       
        const token = jwt.sign(
            { 
                userId: newUser.ID, 
                email: newUser.Email 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
      
        res.status(201).json({
            success: true,
            message: 'Sikeres regisztráció!',
            userId: newUser.ID,
            token
        });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            error: 'Szerverhiba történt!' 
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, jelszo } = req.body;
        
      
        if (!email || !jelszo) {
            return res.status(400).json({ 
                error: 'Email és jelszó megadása kötelező!' 
            });
        }
        
        const user = await prisma.felhasznalok.findUnique({
            where: { Email: email },
            include: {
                jogosultsag: {
                    select: { nev: true }
                }
            }
        });
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Hibás email vagy jelszó!' 
            });
        }
        
     
        const isValidPassword = await bcrypt.compare(jelszo, user.Jelszo);
        
        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Hibás email vagy jelszó!' 
            });
        }
        
      
        const token = jwt.sign(
            { 
                userId: user.ID, 
                email: user.Email 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
       
        const { Jelszo, ...userWithoutPassword } = user;
        
        // Válasz
        res.json({
            success: true,
            message: 'Sikeres bejelentkezés!',
            user: userWithoutPassword,
            token
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Szerverhiba történt!' 
        });
    }
};


export const getProfile = async (req, res) => {
    try {
        const user = await prisma.felhasznalok.findUnique({
            where: { ID: req.user.userId },
            select: {
                ID: true,
                Email: true,
                Vezeteknev: true,
                Keresztnev: true,
                Iranyitoszam: true,
                Varos: true,
                Lakcim: true,
                jogosultsag: {
                    select: { nev: true }
                }
            }
        });
        
        if (!user) {
            return res.status(404).json({ 
                error: 'Felhasználó nem található!' 
            });
        }
        
        res.json({
            success: true,
            user
        });
        
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            error: 'Szerverhiba történt!' 
        });
    }
};