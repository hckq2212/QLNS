
import quoteService from '../services/quoteService.js';

const quoteController = {
  // Lấy tất cả báo giá
  getAll: async (req, res) => {
    try {
      const rows = await quoteService.getAll();
      return res.json(rows);
    } catch (err) {
      console.error('quote.getAll error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Lấy báo giá theo ID
  getById: async (req, res) => {
    try {
      const row = await quoteService.getById(req.params.id);
      if (!row) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      return res.json(row);
    } catch (err) {
      console.error('quote.getById error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Tạo mới một báo giá
  create: async (req, res) => {
    try {
      const { opportunity_service_ids, status, comment } = req.body;
      console.log(req.body)
      const quote = await quoteService.create(opportunity_service_ids, status, comment);
      return res.status(201).json(quote);
    } catch (err) {
      console.error('quote.create error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Cập nhật trạng thái báo giá
  update: async (req, res) => {
    try {
      const { status, comment } = req.body;
      const quote = await quoteService.update(req.params.id, status, comment);
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      return res.json(quote);
    } catch (err) {
      console.error('quote.update error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Xóa báo giá
  delete: async (req, res) => {
    try {
      const result = await quoteService.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      return res.status(204).send(); // No content
    } catch (err) {
      console.error('quote.delete error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default quoteController
