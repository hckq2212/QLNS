import { serviceJobCriteriaService } from '../services/serviceJobCriteriaService.js';

export const serviceJobCriteriaController = {
  getByServiceJob: async (req, res) => {
    try {
      const { service_job_id } = req.params;
      const result = await serviceJobCriteriaService.getAllByServiceJob(service_job_id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await serviceJobCriteriaService.getById(id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const result = await serviceJobCriteriaService.create(req.body);
      return res.status(201).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await serviceJobCriteriaService.update(id, req.body);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await serviceJobCriteriaService.remove(id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
};
