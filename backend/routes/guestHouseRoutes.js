import express from 'express';
import {createGuestHouse, getGuestHouses} from '../controller/guestHouseController.js';

const router = express.Router();

//Route to create guest house
router.post('/', createGuestHouse);

// Route to get all guest house
router.get('/', getGuestHouses);

export default router;