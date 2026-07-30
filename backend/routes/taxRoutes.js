import express from 'express';
import { listTaxes, createTax, updateTax, deleteTax } from '../controller/taxController.js';

const router = express.Router();

router.get('/', listTaxes);
router.post('/', createTax);
router.patch('/:id', updateTax);
router.delete('/:id', deleteTax);

export default router;
