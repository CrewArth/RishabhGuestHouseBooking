import express from 'express';
import { getAuditLogs, exportDailyAuditLogs } from '../controller/auditLogController.js';

const router = express.Router();

router.post('/list', getAuditLogs);
router.post('/export/daily', exportDailyAuditLogs);

export default router;
