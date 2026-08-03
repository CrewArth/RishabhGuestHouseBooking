import express from 'express';
import { createPayment, getInvoiceByBookingId, listOutstandingReceipts, listPayments, listCheckedOutBookings } from '../controller/paymentController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', listPayments);
router.get('/outstanding', listOutstandingReceipts);
router.post('/outstanding', authenticate, listOutstandingReceipts);
router.post('/checked-out', authenticate, listCheckedOutBookings);
router.get('/booking/:bookingId/invoice', getInvoiceByBookingId);
router.post('/', createPayment);

export default router;
