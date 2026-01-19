import express from 'express';
import businessFieldController from '../controllers/businessFieldController.js';

const router = express.Router();

// GET /api/business-fields - Lấy tất cả business fields
router.get('/', businessFieldController.getAll);

// GET /api/business-fields/:code - Lấy business field theo code
router.get('/:code', businessFieldController.getByCode);

// POST /api/business-fields - Tạo business field mới (có thể cần role middleware)
router.post('/', businessFieldController.create);

// PUT /api/business-fields/:code - Cập nhật business field (có thể cần role middleware)
router.put('/:code', businessFieldController.update);

// DELETE /api/business-fields/:code - Xóa business field (có thể cần role middleware)
router.delete('/:code', businessFieldController.remove);

export default router;
