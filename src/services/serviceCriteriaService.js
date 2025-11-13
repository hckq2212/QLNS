import { serviceCriteria } from '../models/serviceCriteria.js';

export const serviceCriteriaService = {
  getAllByService: async (serviceId) => {
    return await serviceCriteria.getByServiceId(serviceId);
  },

  getById: async (id) => {
    const data = await serviceCriteria.getById(id);
    if (!data) throw new Error('Không tìm thấy tiêu chí');
    return data;
  },

  create: async (payload) => {
    if (!payload?.service_id || !payload?.name) {
      throw new Error('Thiếu thông tin service_id hoặc name');
    }
    return await serviceCriteria.create(payload);
  },

  update: async (id, payload) => {
    const existing = await serviceCriteria.getById(id);
    if (!existing) throw new Error('Không tìm thấy tiêu chí');
    return await serviceCriteria.update(id, payload);
  },

  remove: async (id) => {
    const existing = await serviceCriteria.getById(id);
    if (!existing) throw new Error('Không tìm thấy tiêu chí');
    await serviceCriteria.remove(id);
    return { message: 'Xóa tiêu chí thành công' };
  }
};
