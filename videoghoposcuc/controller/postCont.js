import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getPost = async (req, res) => {
    try{
        const post =await prisma.hirdetes.findMany({})

        res.json(post);
    } catch (error){
        console.error('Prisma error:', error);
        res.status(500).json({error:'Failed to fetch posts'});
    }
};
export const updPost = async (req, res) => {
    const {id}= req.params;
    const{Cim, Leiras, Allapot, felhasznalok, termekek, kepek, velem_nyek } = req.body;
    try{
        await prisma.hirdetes.update({
            where:{
                id:Number(id)
            },
            data:{
                Cim: Cim,
                Leiras: Leiras,
                Allapot: Allapot,
                felhasznalok: felhasznalok,
                termekek: termekek,
                kepek: kepek,
                velem_nyek: velem_nyek
            }
        });
        res.json("Adatok frisitve")
    } catch (error) {
        console.error("Error updating:", error);
    }
    
}

export const crePost = async (req,res) => {
    const {Cim, Leiras, Allapot, felhasznalok, termekek, kepek, velem_nyek } = req.body;
    try{
        const newPos= await prisma.post_id.create({
            
            data:{
                Cim: Cim,
                Leiras: Leiras,
                Allapot: Allapot,
                felhasznalok: felhasznalok,
                termekek: termekek,
                kepek: kepek,
                velem_nyek: velem_nyek
            }
        });
        res.json("Poszt létrehozvaí");
    } catch (error){
        console.error("Error creating:", error);
    }
}
