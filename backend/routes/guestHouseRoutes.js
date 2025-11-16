import express from 'express';
import {
  createGuestHouse,
  getGuestHouses,
  toggleMaintenanceMode,
  deleteGuestHouse,
  getGuestHouseById,
  updateGuestHouse
} from '../controller/guestHouseController.js';

import { upload, processAndUploadImage } from '../middlewares/imageUpload.js';

const router = express.Router();

// Create Guest House (with image optimization)
router.post(
  '/',
  upload,                 // multer memory upload
  processAndUploadImage,  // sharp → optimized → upload to S3
  createGuestHouse
);

// Get all Guest Houses
router.get('/', getGuestHouses);

// Toggle Maintenance
router.patch('/:guestHouseId/maintenance', toggleMaintenanceMode);

// Get Guest House by ID
router.get('/:guestHouseId', getGuestHouseById);

// Delete Guest House
router.delete('/:guestHouseId', deleteGuestHouse);

// Update Guest House (with image optimization)
router.put(
  '/:guestHouseId',
  upload,
  processAndUploadImage,
  updateGuestHouse
);

export default router;
