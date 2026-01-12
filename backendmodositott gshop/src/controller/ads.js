import prisma from '../prisma.js';


export const getAllAds = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
      
        const where = {};
        if (search) {
            where.OR = [
                { Cim: { contains: search } },
                { leiras: { contains: search } },
                { termekek: { Nev: { contains: search } } }
            ];
        }
        
   
        const [ads, total] = await Promise.all([
            prisma.hirdetes.findMany({
                where,
                include: {
                    termekek: true,
                    felhasznalok: {
                        select: {
                            Vezeteknev: true,
                            Keresztnev: true,
                            Email: true,
                            Varos: true
                        }
                    },
                    kepek: {
                        take: 1
                    },
                    _count: {
                        select: { velemények: true }
                    }
                },
                skip: skip,
                take: parseInt(limit),
                orderBy: { id: 'desc' }
            }),
            prisma.hirdetes.count({ where })
        ]);
        
        res.json({
            success: true,
            ads,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
        
    } catch (error) {
        console.error('Get ads error:', error);
        res.status(500).json({ 
            error: 'Hirdetések betöltése sikertelen!' 
        });
    }
};


export const getAdById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        const ad = await prisma.hirdetes.findUnique({
            where: { id },
            include: {
                termekek: true,
                felhasznalok: {
                    select: {
                        ID: true,
                        Vezeteknev: true,
                        Keresztnev: true,
                        Email: true,
                        Varos: true
                    }
                },
                kepek: true,
                velemények: {
                    include: {
                        felhasznalok: {
                            select: {
                                Vezeteknev: true,
                                Keresztnev: true
                            }
                        }
                    },
                    orderBy: { Datum: 'desc' }
                }
            }
        });
        
        if (!ad) {
            return res.status(404).json({ 
                error: 'Hirdetés nem található!' 
            });
        }
        
        res.json({
            success: true,
            ad
        });
        
    } catch (error) {
        console.error('Get ad error:', error);
        res.status(500).json({ 
            error: 'Hirdetés betöltése sikertelen!' 
        });
    }
};


export const createAd = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { Cim, leiras, termek_nev, Allapot, Evjarat, Gyarto, AR } = req.body;
        
        // Validáció
        if (!Cim || !termek_nev) {
            return res.status(400).json({ 
                error: 'Cím és terméknév kötelező!' 
            });
        }
        
       
        const result = await prisma.$transaction(async (tx) => {
  
            const termek = await tx.termekek.create({
                data: {
                    Nev: termek_nev,
                    Allapot: Allapot || 'használt',
                    Evjarat: Evjarat ? parseInt(Evjarat) : null,
                    Gyarto: Gyarto || null,
                    AR: AR ? parseFloat(AR) : null
                }
            });
            
        
            const hirdetes = await tx.hirdetes.create({
                data: {
                    Cim,
                    leiras: leiras || '',
                    allapot: 'aktív',
                    FelhasznaloID: userId,
                    TermekID: termek.Id
                }
            });
            
           
            if (req.files && req.files.length > 0) {
                const kepAdatok = req.files.map(file => ({
                    HirdetesID: hirdetes.id,
                    kep_url: `/uploads/${file.filename}`,
                    kep_nev: file.originalname
                }));
                
                await tx.kepek.createMany({
                    data: kepAdatok
                });
            }
            
            return { hirdetes, termek };
        });
        
        res.status(201).json({
            success: true,
            message: 'Hirdetés sikeresen létrehozva!',
            adId: result.hirdetes.id,
            termekId: result.termek.Id
        });
        
    } catch (error) {
        console.error('Create ad error:', error);
        res.status(500).json({ 
            error: 'Hirdetés létrehozása sikertelen!' 
        });
    }
};

// Saját hirdetések
export const getMyAds = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const ads = await prisma.hirdetes.findMany({
            where: { FelhasznaloID: userId },
            include: {
                termekek: true,
                kepek: {
                    take: 1
                },
                _count: {
                    select: { velemények: true }
                }
            },
            orderBy: { id: 'desc' }
        });
        
        res.json({
            success: true,
            ads
        });
        
    } catch (error) {
        console.error('Get my ads error:', error);
        res.status(500).json({ 
            error: 'Hirdetések betöltése sikertelen!' 
        });
    }
};