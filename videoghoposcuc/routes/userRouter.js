import express from 'express';
import { getUsers, creUsers, updUser, delUser } from '../controller/userCont.js';

const router = express.Router();

router.get('/users', getUsers);
router.post('/users', creUsers);
router.put('/users/:id', updUser);
router.delete('/users/:id', delUser);

export default router;
