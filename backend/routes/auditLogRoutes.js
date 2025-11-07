import express from 'express';
import { getAuditLogs } from '../controller/auditLogController.js';

const router = express.Router();

router.get('/', getAuditLogs);

export default router;
