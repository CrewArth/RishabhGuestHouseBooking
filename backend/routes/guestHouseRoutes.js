import express from 'express';
import { createGuestHouse, getGuestHouses, toggleMaintenanceMode, deleteGuestHouse } from '../controller/guestHouseController.js';
import upload from '../middlewares/imageUpload.js';

const router = express.Router();

//Route to create guest house
router.post('/', upload.single('image'), createGuestHouse);

// Route to get all guest house
router.get('/', getGuestHouses);

// Toggle maintenance mode (PATCH)
router.patch('/:guestHouseId/maintenance', toggleMaintenanceMode);

// Route to Delete GH
router.delete('/:guestHouseId', deleteGuestHouse);

export default router;