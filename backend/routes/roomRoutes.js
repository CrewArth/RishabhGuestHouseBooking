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
router.post('/by-guesthouse', getRoomsByGuestHouse); // ✅ place before /:id
router.post('/list', listRooms);
router.get('/:id', getRoomById);
router.put('/:id', updateRoom);
router.patch('/:id/availability', setAvailability);
router.delete('/:id', softDeleteRoom);


export default router;
