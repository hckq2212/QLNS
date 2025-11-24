import express from 'express';
import contractServiceReviewController from '../controllers/contractServiceReviewController.js';

const contractServiceReviewRoute = express.Router();

// Lấy form đánh giá dịch vụ đã làm
contractServiceReviewRoute.get('/:id/review-form', contractServiceReviewController.getReviewForm);
// Gửi đánh giá
contractServiceReviewRoute.post('/:id/review', contractServiceReviewController.createReview);

// Xem lại đánh giá
contractServiceReviewRoute.get('/:id/review', contractServiceReviewController.getReview);

export default contractServiceReviewRoute;
