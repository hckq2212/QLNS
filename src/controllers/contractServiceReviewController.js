import  contractServiceReviewService from '../services/contractServiceReviewService.js';

const contractServiceReviewController = {
  getReviewForm: async (req, res) => {
    try {
      const { id } = req.params; // contract_service_id
      const result = await contractServiceReviewService.getReviewForm(id);
      return res.status(200).json(result);
    } catch (err) {
      console.error('getReviewForm error:', err);
      return res.status(400).json({ error: err.message });
    }
  },
   createReview: async (req, res) => {
    try {
      const { id } = req.params; // contract_service_id
      const result = await contractServiceReviewService.createReview(id, req.body);
      return res.status(201).json(result);
    } catch (err) {
      console.error('createReview error:', err);
      return res.status(400).json({ error: err.message });
    }
  },

  // Lấy review
  getReview: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await contractServiceReviewService.getReview(id);
      return res.status(200).json(result || { message: 'Chưa có đánh giá' });
    } catch (err) {
      console.error('getReview error:', err);
      return res.status(400).json({ error: err.message });
    }
  }
};
export default contractServiceReviewController