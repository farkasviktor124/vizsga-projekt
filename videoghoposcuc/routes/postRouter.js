import express from 'express';
import { getPost } from '../controller/postCont';
import { updPost } from '../controller/postCont';
import { crePost } from '../controller/postCont';

const router =  express.Router();

router.get('/all', getPost);
router.patch('/:id', updPost);
router.put('/:id',crePost);
export default router;