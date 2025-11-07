import express from 'express';
import {
  createRoom,
  getRoomById,
  getRoomsByGuestHouse,
  listRooms,
  setAvailability,
  softDeleteRoom,
  updateRoom
} from '../controller/roomController.js';

const router = express.Router();

router.post('/', createRoom);
router.get('/by-guesthouse', getRoomsByGuestHouse); // ✅ place before /:id
router.get('/', listRooms);
router.get('/:id', getRoomById);
router.put('/:id', updateRoom);
router.patch('/:id/availability', setAvailability);
router.delete('/:id', softDeleteRoom);


export default router;
