import quote from '../models/quote.js'

const quoteService = {
  // Lấy tất cả báo giá
  getAll: async () => {
    return await quote.getAll(); // Gọi model để lấy dữ liệu từ cơ sở dữ liệu
  },

  // Lấy báo giá theo ID
  getById: async (id) => {
    return await quote.getById(id); // Gọi model để lấy dữ liệu theo ID
  },

  // Tạo mới một báo giá
  create: async (opportunity_service_ids, status = 'pending', comment = '') => {
    return await quote.create(opportunity_service_ids, status, comment); // Gọi model để tạo báo giá mới
  },

  // Cập nhật trạng thái báo giá
  update: async (id, status, comment) => {
    return await quote.update(id, status, comment); // Gọi model để cập nhật báo giá
  },

  // Xóa báo giá
  delete: async (id) => {
    return await quote.delete(id); // Gọi model để xóa báo giá
  },
};

export default quoteService;
