import express from 'express';
import {
  getAdminSummary,
  listUsers,
  getBookingsPerDay,
  getTopGuestHouses,
  createUserByAdmin,
  assignGuestHouse,
  getMe,
} from '../controller/adminController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/summary', getAdminSummary);
router.get('/me', authenticate, getMe);
router.get('/users', listUsers);
router.post('/users', createUserByAdmin);
router.patch('/users/:id/assign-guesthouse', authenticate, authorize('SUPER_ADMIN'), assignGuestHouse);
router.get('/metrics/bookings-per-day', getBookingsPerDay);
router.get('/metrics/top-guest-houses', getTopGuestHouses);

export default router;
