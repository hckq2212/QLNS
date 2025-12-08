// controllers/referralController.js
import referralService from '../services/referralService.js';

const referralController = {
  list: async (req, res) => {
    try {
      const data = await referralService.list(req.query);
      return res.json(data);
    } catch (err) {
      console.error('referral list error', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  },

  detail: async (req, res) => {
    try {
      const id = req.params.id;
      const data = await referralService.detail(id);
      if (!data) {
        return res.status(404).json({ error: 'Referral partner không tồn tại' });
      }
      return res.json(data);
    } catch (err) {
      console.error('referral detail error', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  },

  create: async (req, res) => {
    try {
      const user = req.user || {};
      const data = await referralService.create(req.body, user);
      return res.status(201).json(data);
    } catch (err) {
      console.error('referral create error', err);
      return res
        .status(400)
        .json({ error: err.message || 'Không tạo được referral partner' });
    }
  },

  update: async (req, res) => {
    try {
      const user = req.user || {};
      const id = req.params.id;
      const data = await referralService.update(id, req.body, user);
      return res.json(data);
    } catch (err) {
      console.error('referral update error', err);
      if (err.message === 'Referral partner không tồn tại') {
        return res.status(404).json({ error: err.message });
      }
      return res
        .status(400)
        .json({ error: err.message || 'Không cập nhật được referral partner' });
    }
  },

  softDelete: async (req, res) => {
    try {
      const user = req.user || {};
      const id = req.params.id;
      const data = await referralService.softDelete(id, user);
      return res.json(data);
    } catch (err) {
      console.error('referral delete error', err);
      if (err.message === 'Referral partner không tồn tại') {
        return res.status(404).json({ error: err.message });
      }
      return res
        .status(400)
        .json({ error: err.message || 'Không xoá được referral partner' });
    }
  },

  listCustomers: async (req, res) => {
    try {
      const id = req.params.id;
      const data = await referralService.listCustomers(id);
      return res.json(data);
    } catch (err) {
      console.error('referral customers error', err);
      if (err.message === 'Referral partner không tồn tại') {
        return res.status(404).json({ error: err.message });
      }
      return res
        .status(500)
        .json({ error: err.message || 'Internal server error' });
    }
  }
};

export default referralController;
