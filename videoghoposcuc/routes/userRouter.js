import express from 'express';
import { getUsers } from '../controller/userCont.js';
import { updUser } from '../controller/userCont.js';
import { creUsers } from '../controller/userCont.js';

const router = express.Router();

// GET /api/users → összes felhasználó lekérése
router.get('/all', getUsers);
router.patch('/:id',updUser);
router.put('/create',creUsers);
export default router;