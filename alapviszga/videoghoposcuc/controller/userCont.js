import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// GET - összes felhasználó
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.felhasznalok.findMany({});
    res.json(users);
  } catch (error) {
    console.error('Prisma error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// POST - új felhasználó létrehozása
export const creUsers = async (req, res) => {
  const { Vezeteknev, Keresztnev, Email, Iranyitoszam, Telefonszam, Lakcim, Jelszo } = req.body;
  try {
    const newUser = await prisma.felhasznalok.create({
      data: { Vezeteknev, Keresztnev, Email, Iranyitoszam, Telefonszam, Lakcim, Jelszo }
    });
    res.json({ message: "Felhasználó létrehozva haver srác", newUser });
  } catch (error) {
    console.error("Error creating:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

// PUT - meglévő felhasználó frissítése
export const updUser = async (req, res) => {
  const { id } = req.params;
  const { Email, Iranyitoszam, Varos, Lakcim, Jelszo } = req.body;

  try {
    // Ellenőrzés: létezik-e a felhasználó
    const existingUser = await prisma.felhasznalok.findUnique({
      where: { ID: Number(id) }
    });

    if (!existingUser) {
      return res.status(404).json({ error: `Nincs ilyen felhasználó: ID ${id}` });
    }

    // Frissítés
    const updatedUser = await prisma.felhasznalok.update({
      where: { ID: Number(id) },
      data: { Email, Iranyitoszam, Varos, Lakcim, Jelszo }
    });

    res.json({ message: "Adatok frissítve lettek öcsi pók", updatedUser });
  } catch (error) {
    console.error("Error updating:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// DELETE - felhasználó törlése
export const delUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Ellenőrzés: létezik-e a felhasználó
    const existingUser = await prisma.felhasznalok.findUnique({
      where: { ID: Number(id) }
    });

    if (!existingUser) {
      return res.status(404).json({ error: `Nincs ilyen felhasználó: ID ${id}` });
    }

    const deletedUser = await prisma.felhasznalok.delete({
      where: { ID: Number(id) }
    });
    res.json({ message: "Felhasználó törölve lett tesó", deletedUser });
  } catch (error) {
    console.error("Error deleting:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};
