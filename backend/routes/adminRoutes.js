import express from 'express';
import {
  getAdminSummary,
  listUsers,
  getBookingsPerDay,
  getTopGuestHouses,
  createUserByAdmin
} from '../controller/adminController.js';

const router = express.Router();

router.get('/summary', getAdminSummary);
router.get('/users', listUsers);
router.post('/users', createUserByAdmin); // Create user by admin
router.get('/metrics/bookings-per-day', getBookingsPerDay);
router.get('/metrics/top-guest-houses', getTopGuestHouses);

export default router;
