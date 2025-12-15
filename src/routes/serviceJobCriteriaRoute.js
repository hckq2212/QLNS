import express from 'express';
import { serviceJobCriteriaController } from '../controllers/serviceJobCriteriaController.js';

const router = express.Router();

// GET all criteria for a service_job
router.get('/service-job/:service_job_id', serviceJobCriteriaController.getByServiceJob);

// GET single criteria
router.get('/:id', serviceJobCriteriaController.getById);

// POST create new criteria
router.post('/', serviceJobCriteriaController.create);

// PUT update criteria
router.put('/:id', serviceJobCriteriaController.update);

// DELETE criteria
router.delete('/:id', serviceJobCriteriaController.remove);

export default router;
