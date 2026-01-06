import { acceptanceService } from '../services/acceptanceService.js';

export const acceptanceController = {
  createDraft: async (req, res) => {
    try {
      console.log(req.body)
      const created_by = req.user.id
      const data = await acceptanceService.createDraft(req.body,created_by);
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

 approveByBOD : async (req, res) => {
  const { id, jobId } = req.params;
  const userId = req.user.id; // tuỳ hệ auth của bạn
  const data = await acceptanceService.approveByBOD(id, jobId, userId);
  res.json(data);
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
  },
  getByProject : async (req, res) => {
  try {
    const projectId = req.params.project_id;
    const data = await acceptanceService.getByProject(projectId);
    return res.status(200).json({
      project_id: projectId,
      count: data.length,
      records: data,
    });
  } catch (err) {
    console.error('getByProject error:', err);
    return res.status(500).json({ error: err.message });
  }
  },
 getById : async (req, res) => {
  try {
    const id = req.params.id;
    const data = await acceptanceService.getById(id);

    if (!data) {
      return res.status(404).json({ error: 'Không tìm thấy biên bản nghiệm thu' });
    }

    return res.status(200).json({
      message: 'Lấy thông tin biên bản nghiệm thu thành công',
      data,
    });
  } catch (err) {
    console.error('getById error:', err);
    return res.status(500).json({ error: err.message });
  }
}


}