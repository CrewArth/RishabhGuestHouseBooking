import express from 'express';
import {
  getReportsList,
  getFilters,
  generatePdf,
  getPermissions,
  updatePermissions,
} from '../controllers/reportController.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, getReportsList);
router.get('/permissions/:adminId', authenticate, authorize('SUPER_ADMIN'), getPermissions);
router.put('/permissions/:adminId', authenticate, authorize('SUPER_ADMIN'), updatePermissions);

router.get('/:reportName/filters', authenticate, getFilters);
router.post('/:reportName/generate', authenticate, generatePdf);

export default router;
