import express from 'express';
import { acceptanceController } from '../controllers/acceptanceController.js';

const router = express.Router();

// POST /acceptance/draft
router.post('/draft', acceptanceController.createDraft);

// PUT /acceptance/:id/submit-bod
router.put('/:id/submit-bod', acceptanceController.submitToBOD);

// PATCH /acceptance/:id/approve
router.patch('/:id/approve/:jobId', acceptanceController.approveByBOD);

// PUT /acceptance/:id/reject
router.put('/:id/reject', acceptanceController.rejectByBOD);

router.get('/project/:project_id', acceptanceController.getByProject);

router.get('/:id', acceptanceController.getById);

export default router;
