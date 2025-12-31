import express from 'express';
import { acceptanceController } from '../controllers/acceptanceController.js';

const router = express.Router();

// POST /acceptance/draft
router.post('/draft', acceptanceController.createDraft);

// PUT /acceptance/:id/submit-bod
router.put('/:id/submit-bod', acceptanceController.submitToBOD);

// PUT /acceptance/:id/approve
router.put('/:id/approve', acceptanceController.approveByBOD);

// PUT /acceptance/:id/reject
router.put('/:id/reject', acceptanceController.rejectByBOD);

export default router;
