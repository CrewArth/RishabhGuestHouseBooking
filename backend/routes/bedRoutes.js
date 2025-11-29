import express from 'express';
import {createBed, listBedsByRoom, softDeleteBed, toggleAvailability, updateBed, autoCreateBeds} from '../controller/bedController.js';

const router = express.Router();

router.post('/', createBed);
router.post('/auto-create', autoCreateBeds);
router.get('/', listBedsByRoom);
router.put('/:id', updateBed);
router.patch('/:id/availability', toggleAvailability);
router.delete('/:id', softDeleteBed);

export default router;