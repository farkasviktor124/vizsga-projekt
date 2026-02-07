import express from 'express';

import { getPost } from '../controller/postCont.js';
import { updPost } from '../controller/postCont.js';
import { crePost } from '../controller/postCont.js';


const router =  express.Router();

router.get('/all', getPost);
router.patch('/:id', updPost);
router.put('/:id',crePost);
export default router;