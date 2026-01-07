import express from 'express';
import { acceptanceController } from '../controllers/acceptanceController.js';

const router = express.Router();

router.post('/draft', acceptanceController.createDraft);

router.put('/:id/submit-bod', acceptanceController.submitToBOD);

router.patch('/:id/approve/:jobId', acceptanceController.approveByBOD);

router.patch('/:id/reject/:jobId', acceptanceController.rejectByBOD);

router.get('/project/:project_id', acceptanceController.getByProject);

router.get('/:id', acceptanceController.getById);

export default router;
