import express from 'express';
import { triggerExport, getExportHistory, getExportStatus } from '../controllers/exportController.js';

const router = express.Router();

router.post('/', triggerExport);
router.get('/history', getExportHistory);
router.get('/status/:id', getExportStatus);

export default router;
