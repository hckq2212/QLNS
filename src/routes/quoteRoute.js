// src/routes/quoteRoutes.js
import express from 'express';

import quoteController from '../controllers/quoteController.js'

const router = express.Router()
// Lấy tất cả báo giá
router.get('/', quoteController.getAll);

// Lấy báo giá theo ID
router.get('/:id', quoteController.getById);

// Tạo mới một báo giá
router.post('/', quoteController.create);

// Cập nhật trạng thái báo giá
router.put('/:id', quoteController.update);

// Xóa báo giá
router.delete('/:id', quoteController.delete);

export default router
