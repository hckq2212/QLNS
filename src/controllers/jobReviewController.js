import { jobReviewService } from '../services/jobReviewService.js';

export const jobReviewController = {
  getReviewForm: async (req, res) => {
    try {
      const { id } = req.params; // job_id
      const type = req.query.type || 'lead'; // default = lead
      const result = await jobReviewService.getReviewForm(id, type);
      return res.status(200).json(result);
    } catch (err) {
      console.error('getReviewForm error:', err);
      return res.status(400).json({ error: err.message });
    }
  },

  createReview: async (req, res) => {
    try {
      const { id } = req.params; // job_id
      const reviewed_by = req.user.id
      const type = req.query.review_type || 'lead';
      const result = await jobReviewService.createReview(id,reviewed_by, type, req.body);
      return res.status(201).json(result);
    } catch (err) {
      console.error('createReview error:', err);
      return res.status(400).json({ error: err.message });
    }
  }
};
