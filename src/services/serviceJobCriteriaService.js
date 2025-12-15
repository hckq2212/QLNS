import { serviceJobCriteria } from '../models/serviceJobCriteria.js';

export const serviceJobCriteriaService = {
  getAllByServiceJob: async (serviceJobId) => {
    return await serviceJobCriteria.getByServiceJobId(serviceJobId);
  },

  getById: async (id) => {
    const data = await serviceJobCriteria.getById(id);
    if (!data) throw new Error('Không tìm thấy tiêu chí');
    return data;
  },

  create: async (payload) => {
    if (!payload?.service_job_id || !payload?.name) {
      throw new Error('Thiếu thông tin service_job_id hoặc name');
    }
    return await serviceJobCriteria.create(payload);
  },

  update: async (id, payload) => {
    const existing = await serviceJobCriteria.getById(id);
    if (!existing) throw new Error('Không tìm thấy tiêu chí');
    return await serviceJobCriteria.update(id, payload);
  },

  remove: async (id) => {
    const existing = await serviceJobCriteria.getById(id);
    if (!existing) throw new Error('Không tìm thấy tiêu chí');
    await serviceJobCriteria.remove(id);
    return { message: 'Xóa tiêu chí thành công' };
  }
};
