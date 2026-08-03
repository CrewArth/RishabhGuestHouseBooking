import express from 'express';
import {
  getAdminSummary,
  listUsers,
  getBookingsPerDay,
  getTopGuestHouses,
  createUserByAdmin,
  assignGuestHouse,
  updateUserWidgets,
  getMe,
} from '../controller/adminController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { uploadESignature, processAndUploadESignature } from '../middlewares/imageUpload.js';

const router = express.Router();

router.get('/summary', authenticate, getAdminSummary);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, listUsers);
router.post(
  '/users',
  authenticate,
  authorize('SUPER_ADMIN'),
  uploadESignature,
  processAndUploadESignature,
  createUserByAdmin
);
router.patch('/users/:id/assign-guesthouse', authenticate, authorize('SUPER_ADMIN'), assignGuestHouse);
router.patch('/users/:id/widgets', authenticate, authorize('SUPER_ADMIN'), updateUserWidgets);
router.get('/metrics/bookings-per-day', authenticate, getBookingsPerDay);
router.get('/metrics/top-guest-houses', authenticate, getTopGuestHouses);

export default router;
