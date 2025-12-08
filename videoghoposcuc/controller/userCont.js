import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.felhasznalok.findMany({})
    
    res.json(users);
  } catch (error) {
    console.error('Prisma error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};
export const updUser = async (req,res)=>{
  const {id}= req.params;
  const{Email , Iranyitoszam , Varos , Lakcim , Jelszo} = req.body;
 try {
    await prisma.felhasznalok.update({
      where:{
        id:Number(id)   
      },
      data:{
          Email: Email,
          Iranyitoszam: Iranyitoszam,
          Varos: Varos,
          Lakcim:Lakcim,
          Jelszo:Jelszo
      }
    })
    res.json("Adatok frisitve lettek öcsi pók")
 } catch (error) {
  console.error("Error updating:", error);
 }

}

export const creUsers = async (req, res) => {

    const { Vezeteknev, Keresztnev, Email, Iranyitoszam, Telefonszam, Lakcim } = req.body;
    try {
        const newCos = await prisma.customers_id.create({
            data: {
              Vezeteknev: Vezeteknev,
              Keresztnev: Keresztnev,
              Email: Email,
              Iranyitoszam: Iranyitoszam,
              Telefonszam: Telefonszam,
              Lakcim: Lakcim
               
            }

        });
        res.json("Flhasználó létrehozva haver srác");
    } catch (error) {
        console.error("Error creating:", error);
    }
 }

