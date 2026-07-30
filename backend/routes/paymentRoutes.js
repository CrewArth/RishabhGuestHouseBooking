import express from 'express';
import { createPayment, getInvoiceByBookingId, listOutstandingReceipts, listPayments } from '../controller/paymentController.js';

const router = express.Router();

router.get('/', listPayments);
router.get('/outstanding', listOutstandingReceipts);
router.get('/booking/:bookingId/invoice', getInvoiceByBookingId);
router.post('/', createPayment);

export default router;
