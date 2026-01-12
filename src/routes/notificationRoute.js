import express from 'express';
import notificationController from '../controllers/notificationController.js';

const router = express.Router();

// Lấy tất cả thông báo (có thể filter)
router.get('/', notificationController.getAll);

// Lấy thông báo theo ID
router.get('/:id', notificationController.getById);

// Lấy thông báo theo user_id
router.get('/user/:userId', notificationController.getByUserId);

// Đếm số thông báo chưa đọc của user
router.get('/user/:userId/unread-count', notificationController.countUnread);

// Đánh dấu tất cả thông báo của user đã đọc
router.put('/user/:userId/mark-all-read', notificationController.markAllAsRead);

// Xóa tất cả thông báo đã đọc của user
router.delete('/user/:userId/read', notificationController.deleteReadNotifications);

// Đánh dấu thông báo đã đọc
router.put('/:id/read', notificationController.markAsRead);

// Tạo mới thông báo
router.post('/', notificationController.create);

// Cập nhật thông báo
router.put('/:id', notificationController.update);

// Xóa thông báo
router.delete('/:id', notificationController.delete);

export default router;
