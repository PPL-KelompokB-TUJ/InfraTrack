import express from 'express';
import { triggerExport, getExportHistory, getExportStatus, deleteBulk } from '../controllers/exportController.js';

const router = express.Router();

router.post('/', triggerExport);
router.get('/history', getExportHistory);
router.get('/status/:id', getExportStatus);
router.post('/delete-bulk', deleteBulk);

export default router;
