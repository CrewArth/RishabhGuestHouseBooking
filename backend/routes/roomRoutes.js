import express from 'express';
import {createRoom, getRoomById, listRooms, setAvailability, softDeleteRoom, updateRoom} from '../controller/roomController.js';

const router = express.Router();

router.post('/', createRoom);
router.get('/', listRooms);
router.get('/:id', getRoomById);
router.put('/:id', updateRoom);
router.patch('/:id/availability', setAvailability);
router.delete('/:id', softDeleteRoom);

export default router;