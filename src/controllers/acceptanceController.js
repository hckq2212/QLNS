import { acceptanceService } from '../services/acceptanceService.js';

export const acceptanceController = {
  createDraft: async (req, res) => {
    try {
      const data = await acceptanceService.createDraft(req.body);
      return res.status(201).json(data);
    } catch (err) {
      console.error('createDraft error:', err);
      return res.status(400).json({ error: err.message });
    }
  },

  submitToBOD: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await acceptanceService.submitToBOD(id);
      return res.status(200).json(result);
    } catch (err) {
      console.error('submitToBOD error:', err);
      return res.status(400).json({ error: err.message });
    }
  },

  approveByBOD: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const result = await acceptanceService.approveByBOD(id, userId);
      return res.status(200).json(result);
    } catch (err) {
      console.error('approveByBOD error:', err);
      return res.status(400).json({ error: err.message });
    }
  },

  rejectByBOD: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const result = await acceptanceService.rejectByBOD(id, userId);
      return res.status(200).json(result);
    } catch (err) {
      console.error('rejectByBOD error:', err);
      return res.status(400).json({ error: err.message });
    }
  }
};
