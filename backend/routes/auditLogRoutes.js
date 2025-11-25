import express from 'express';
import { getAuditLogs, exportDailyAuditLogs } from '../controller/auditLogController.js';

const router = express.Router();

router.get('/', getAuditLogs);
router.get('/export/daily', exportDailyAuditLogs);

export default router;
