import express from 'express';
import { getAdminSummary, listUsers } from '../controller/adminController.js';

const router = express.Router();

router.get('/summary', getAdminSummary);
router.get('/users', listUsers); // <- new

export default router;
