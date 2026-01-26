import opportunities from '../models/opportunities.js';
import quoteService from '../services/quoteService.js';

const quoteController = {
  // GET /api/quote - Lấy tất cả quotes
  getAll: async (req, res) => {
    try {
      const { status, opportunity_id } = req.query;
      const filters = {};
      
      if (status) filters.status = status;
      if (opportunity_id) filters.opportunity_id = Number(opportunity_id);

      const quotes = await quoteService.getAll(filters);
      console.log('[GET] Lấy danh sách báo giá thành công');
      return res.json(quotes);
    } catch (err) {
      console.error('[GET] Lấy danh sách báo giá - LỖI:', err.message || err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/quote/:id - Lấy quote theo ID
  getById: async (req, res) => {
    try {
      const quote = await quoteService.getById(req.params.id);
      console.log(`[GET] Lấy thông tin báo giá ID ${req.params.id} thành công`);
      return res.json(quote);
    } catch (err) {
      console.error(`[GET] Lấy thông tin báo giá ID ${req.params.id} - LỖI:`, err.message || err);
      if (err.message === 'Quote not found') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/quote/opportunity/:opportunityId - Lấy quote theo opportunity_id
  getByOpportunityId: async (req, res) => {
    try {
      const quote = await quoteService.getByOpportunityId(req.params.opportunityId);
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      console.log(`[GET] Lấy báo giá theo cơ hội ID ${req.params.opportunityId} thành công`);
      return res.json(quote);
    } catch (err) {
      console.error(`[GET] Lấy báo giá theo cơ hội ID ${req.params.opportunityId} - LỖI:`, err.message || err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /api/quote - Tạo quote mới
  create: async (req, res) => {
    try {
      const { opportunity_id, note } = req.body;

      if (!opportunity_id) {
        return res.status(400).json({ error: 'opportunity_id is required' });
      }

      const quote = await quoteService.create(Number(opportunity_id), note);
      console.log('[POST] Tạo báo giá thành công');
      return res.status(201).json(quote);
    } catch (err) {
      console.error('[POST] Tạo báo giá - LỖI:', err.message || err);
      if (err.message === 'Opportunity not found') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // PUT /api/quote/:id - Cập nhật quote
  update: async (req, res) => {
    try {
      const { status, note } = req.body;
      const updateData = {};

      if (status !== undefined) updateData.status = status;
      if (note !== undefined) updateData.note = note;

      const quote = await quoteService.update(req.params.id, updateData);
      return res.json(quote);
    } catch (err) {
      console.error('quote.update error', err);
      if (err.message === 'Quote not found') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // DELETE /api/quote/:id - Xóa quote
  delete: async (req, res) => {
    try {
      await quoteService.delete(req.params.id);
      console.log(`[DELETE] Xóa báo giá ID ${req.params.id} thành công`);
      return res.status(204).send();
    } catch (err) {
      console.error(`[DELETE] Xóa báo giá ID ${req.params.id} - LỖI:`, err.message || err);
      if (err.message === 'Quote not found') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
    approve: async (req, res) => {
    try {
      console.log(req.body)
      const status = 'approved'
      const note = req.body.note || null
      console.log(note)
      const updateData = {};

      if (status !== undefined) updateData.status = status;
      if (note !== undefined || note == null) updateData.note = note;

      const quote = await quoteService.update(req.params.id, updateData);
      return res.json(quote);
    } catch (err) {
      console.error('quote.update error', err);
      if (err.message === 'Quote not found') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  reject: async (req, res) => {
    try {
      const status = 'rejected'
      const note = req.body.note || null
      const updateData = {};

      if (status !== undefined) updateData.status = status;
      if (note !== undefined || note == null)  updateData.note = note;

      const quote = await quoteService.reject(req.params.id, updateData);
      console.log(`[POST] Từ chối báo giá ID ${req.params.id} thành công`);
      return res.json(quote);
    } catch (err) {
      console.error(`[PUT] Cập nhật báo giá ID ${req.params.id} - LỖI:`, err.message || err);
      if (err.message === 'Quote not found') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default quoteController;