import jobController from "../controllers/jobController.js";
import express from 'express'
import multer from 'multer'
import { jobReviewController } from "../controllers/jobReviewController.js";

const jobRoute = express.Router();

// use memory storage so we can stream file buffers to Cloudinary
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
// GET /job/:id/review-form?type=lead|sale
jobRoute.get('/:id/review-form', jobReviewController.getReviewForm);

// POST /job/:id/review?type=lead|sale
jobRoute.post('/:id/review', jobReviewController.createReview);

jobRoute.get('/', jobController.getAll);
jobRoute.get('/me', jobController.getMyJob)
jobRoute.get('/project/:projectId', jobController.getByProject)
// accept up to 5 attachments when assigning from multiple possible field names
jobRoute.patch('/:id/assign', upload.fields([
	{ name: 'files', maxCount: 5 },
]), jobController.assign)
jobRoute.patch('/:id/finish', upload.fields([
	{ name: 'evidence', maxCount: 5 },
]), jobController.finish)
jobRoute.get('/:id', jobController.getById);
jobRoute.patch('/:id', jobController.update);
jobRoute.post('/', jobController.create)

export default jobRoute;