import express from 'express';
import { listTaxes, createTax, updateTax, deleteTax } from '../controller/taxController.js';

const router = express.Router();

router.post('/list', listTaxes);
router.post('/', createTax);
router.patch('/:id', updateTax);
router.delete('/:id', deleteTax);

export default router;
