import notification from '../models/notification.js';

const notificationService = {
  // Lấy tất cả thông báo với filters
  getAll: async (filters) => {
    return await notification.getAll(filters);
  },

  // Lấy thông báo theo ID
  getById: async (id) => {
    return await notification.getById(id);
  },

  // Lấy thông báo theo user_id
  getByUserId: async (userId, limit) => {
    return await notification.getByUserId(userId, limit);
  },

  // Đếm số thông báo chưa đọc
  countUnread: async (userId) => {
    return await notification.countUnread(userId);
  },

  // Tạo mới thông báo
  create: async (notificationData) => {
    // Validate required fields
    if (!notificationData.user_id || !notificationData.title) {
      throw new Error('user_id and title are required');
    }

    return await notification.create(notificationData);
  },

  // Cập nhật thông báo
  update: async (id, updateData) => {
    const existingNotification = await notification.getById(id);
    if (!existingNotification) {
      throw new Error('Notification not found');
    }

    return await notification.update(id, updateData);
  },

  // Đánh dấu đã đọc
  markAsRead: async (id) => {
    const existingNotification = await notification.getById(id);
    if (!existingNotification) {
      throw new Error('Notification not found');
    }

    return await notification.markAsRead(id);
  },

  // Đánh dấu tất cả đã đọc
  markAllAsRead: async (userId) => {
    return await notification.markAllAsRead(userId);
  },

  // Xóa thông báo
  delete: async (id) => {
    const existingNotification = await notification.getById(id);
    if (!existingNotification) {
      throw new Error('Notification not found');
    }

    return await notification.delete(id);
  },

  // Xóa thông báo đã đọc
  deleteReadNotifications: async (userId) => {
    return await notification.deleteReadNotifications(userId);
  },
};

export default notificationService;
