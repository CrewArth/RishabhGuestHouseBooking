import express from 'express';
import { loginUser, forgotPassword, resetPassword } from '../controller/authController.js';

const router = express.Router();

router.post('/signin', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;