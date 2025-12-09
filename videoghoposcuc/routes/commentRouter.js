import express from 'express';
import { getCom } from '../controller/commentCont';
import { updCom } from '../controller/commentCont';
import { creCom } from '../controller/commentCont';

const router = express.Router();

router.get('/all', getCom);
router.patch('/:id', updCom);
router.put('/:id', creCom);
export default router;