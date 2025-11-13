import { serviceCriteriaService } from '../services/serviceCriteriaService.js';

export const serviceCriteriaController = {
  // Lấy danh sách tiêu chí theo service_id
  getByService: async (req, res) => {
    try {
      const { service_id } = req.params;
      const result = await serviceCriteriaService.getAllByService(service_id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  // Lấy 1 tiêu chí
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await serviceCriteriaService.getById(id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  },

  // Tạo mới tiêu chí
  create: async (req, res) => {
    try {
      const payload = req.body;
      const result = await serviceCriteriaService.create(payload);
      return res.status(201).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  // Cập nhật tiêu chí
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body;
      const result = await serviceCriteriaService.update(id, payload);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  // Xoá tiêu chí
  remove: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await serviceCriteriaService.remove(id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
};
