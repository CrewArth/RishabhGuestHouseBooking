// routes/contactRoutes.js
import express from 'express';
import { submitContactForm } from '../controller/contactController.js';

const router = express.Router();

// Public route - no authentication required
router.post('/submit', submitContactForm);

export default router;

