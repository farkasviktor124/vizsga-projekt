import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getCom = async (req, res) => {
    try{
        const com = await prisma.velem_nyek.findMany({})

        res.jsom(com);
    }catch (error) {
        console.error('Prisma error:',error);
        res.status(500).json({ error: 'Falled'});
    }
    
};
export const updCom = async (req,res) => {
    const {id}= req.params;
    const{Datum, Szoveg, Ertekeles, felhasznalok, hirdetes} = req.body;
    try{
        await prisma.Ertekeles.update({
            where:{
                id:Number(id)
            },
            data:{
                Datum: Datum,
                Szoveg: Szoveg,
                Ertekeles: Ertekeles,
                felhasznalok: felhasznalok,
                hirdetes: hirdetes
            }
        })
        res.json("Adatok frissitve")
    } catch (error){
        console.error("error updating:", error);
    }
}
export const creCom = async (req, res) => {
    const {Datum, Szoveg, Ertekeles, felhasznalok, hirdetes} = req.body;
    try{
        const newCos = await prisma.comment_id.create({
            data: {
                Datum: Datum,
                Szoveg: Szoveg,
                Ertekeles: Ertekeles,
                felhasznalok: felhasznalok,
                hirdetes: hirdetes
            
            }
        });
        res.json("Comment létrehozva");

    }catch (error){
        console.error("Error creating:", error);
    }
}