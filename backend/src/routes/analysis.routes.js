import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { analyze, getAnalysis, ask, getReport } from '../controllers/analysis.controller.js';

const router = express.Router();

router.post('/:contractId/analyze', requireAuth, analyze);
router.get('/:contractId', requireAuth, getAnalysis);
router.post('/:contractId/ask', requireAuth, ask);
router.get('/:contractId/report', requireAuth, getReport);

export default router;
