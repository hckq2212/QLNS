import express from 'express';
import { jobReviewController } from '../controllers/jobReviewController.js';

const router = express.Router();

// GET /job/:id/review-form?type=lead|sale
router.get('/:id/review-form', jobReviewController.getReviewForm);

// POST /job/:id/review?type=lead|sale
router.post('/:id/review', jobReviewController.createReview);

export default router;
