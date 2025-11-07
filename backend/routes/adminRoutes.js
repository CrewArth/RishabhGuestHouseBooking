import express from 'express';
import { getAdminSummary } from '../controller/adminController.js';

const router = express.Router();

router.get('/summary', getAdminSummary);

export default router;
