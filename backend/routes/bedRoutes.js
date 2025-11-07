import express from 'express';
import {createBed, listBedsByRoom, softDeleteBed, toggleAvailability, updateBed} from '../controller/bedController.js';

const router = express.Router();

router.post('/', createBed);
router.get('/', listBedsByRoom);
router.put('/:id', updateBed);
router.patch('/:id/availability', toggleAvailability);
router.delete('/:id', softDeleteBed);

export default router;