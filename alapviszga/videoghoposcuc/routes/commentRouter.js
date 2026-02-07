import express from 'express';
import { getCom } from '../controller/commentCont.js';
import { updCom } from '../controller/commentCont.js';
import { creCom } from '../controller/commentCont.js';

const router = express.Router();

router.get('/all', getCom);
router.patch('/:id', updCom);
router.put('/:id', creCom);
export default router;