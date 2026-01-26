import notificationService from '../services/notificationService.js';

const notificationController = {
  // Lấy tất cả thông báo
  getAll: async (req, res) => {
    try {
      const filters = {
        user_id: req.query.user_id,
        is_read: req.query.is_read !== undefined ? req.query.is_read === 'true' : undefined,
        type: req.query.type,
      };

      const notifications = await notificationService.getAll(filters);
      console.log('[GET] Lấy danh sách thông báo thành công');
      return res.json(notifications);
    } catch (err) {
      console.error('[GET] Lấy danh sách thông báo - LỖI:', err.message || err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Lấy thông báo theo ID
  getById: async (req, res) => {
    try {
      const notification = await notificationService.getById(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      console.log(`[GET] Lấy thông báo ID ${req.params.id} thành công`);
      return res.json(notification);
    } catch (err) {
      console.error(`[GET] Lấy thông báo ID ${req.params.id} - LỖI:`, err.message || err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Lấy thông báo theo user_id
  getByUserId: async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      
      const notifications = await notificationService.getByUserId(userId, limit);
      console.log(`[GET] Lấy thông báo của người dùng ID ${userId} thành công`);
      return res.json(notifications);
    } catch (err) {
      console.error(`[GET] Lấy thông báo của người dùng ID ${userId} - LỖI:`, err.message || err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Đếm số thông báo chưa đọc
  countUnread: async (req, res) => {
    try {
      const { userId } = req.params;
      const count = await notificationService.countUnread(userId);
      console.log(`[GET] Đếm thông báo chưa đọc của người dùng ID ${userId} thành công`);
      return res.json({ unread_count: count });
    } catch (err) {
      console.error(`[GET] Đếm thông báo chưa đọc của người dùng ID ${userId} - LỖI:`, err.message || err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Tạo mới thông báo
  create: async (req, res) => {
    try {
      const notificationData = req.body;
      const notification = await notificationService.create(notificationData);
      console.log('[POST] Tạo thông báo thành công');
      return res.status(201).json(notification);
    } catch (err) {
      console.error('[POST] Tạo thông báo - LỖI:', err.message || err);
      if (err.message === 'user_id and title are required') {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Cập nhật thông báo
  update: async (req, res) => {
    try {
      const updateData = req.body;
      const notification = await notificationService.update(req.params.id, updateData);
      console.log(`[PATCH] Cập nhật thông báo ID ${req.params.id} thành công`);
      return res.json(notification);
    } catch (err) {
      console.error(`[PATCH] Cập nhật thông báo ID ${req.params.id} - LỖI:`, err.message || err);
      if (err.message === 'Notification not found') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Đánh dấu đã đọc
  markAsRead: async (req, res) => {
    try {
      const notification = await notificationService.markAsRead(req.params.id);
      console.log(`[PATCH] Đánh dấu thông báo ID ${req.params.id} đã đọc thành công`);
      return res.json(notification);
    } catch (err) {
      console.error(`[PATCH] Đánh dấu thông báo ID ${req.params.id} đã đọc - LỖI:`, err.message || err);
      if (err.message === 'Notification not found') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Đánh dấu tất cả đã đọc
  markAllAsRead: async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await notificationService.markAllAsRead(userId);
      console.log(`[PATCH] Đánh dấu tất cả thông báo của người dùng ID ${userId} đã đọc thành công`);
      return res.json({ 
        message: 'All notifications marked as read',
        updated_count: notifications.length 
      });
    } catch (err) {
      console.error(`[PATCH] Đánh dấu tất cả thông báo của người dùng ID ${userId} đã đọc - LỖI:`, err.message || err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Xóa thông báo
  delete: async (req, res) => {
    try {
      const result = await notificationService.delete(req.params.id);
      console.log(`[DELETE] Xóa thông báo ID ${req.params.id} thành công`);
      return res.status(204).send();
    } catch (err) {
      console.error(`[DELETE] Xóa thông báo ID ${req.params.id} - LỖI:`, err.message || err);
      if (err.message === 'Notification not found') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Xóa thông báo đã đọc
  deleteReadNotifications: async (req, res) => {
    try {
      const { userId } = req.params;
      const deletedCount = await notificationService.deleteReadNotifications(userId);
      console.log(`[DELETE] Xóa thông báo đã đọc của người dùng ID ${userId} thành công`);
      return res.json({ 
        message: 'Read notifications deleted',
        deleted_count: deletedCount 
      });
    } catch (err) {
      console.error(`[DELETE] Xóa thông báo đã đọc của người dùng ID ${userId} - LỖI:`, err.message || err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default notificationController;
