import express from 'express';
import quoteController from '../controllers/quoteController.js';

const router = express.Router();

// Lấy tất cả quotes (có thể filter theo status, opportunity_id)
router.get('/', quoteController.getAll);

// Lấy quote theo opportunity_id
router.get('/opportunity/:opportunityId', quoteController.getByOpportunityId);

// Lấy quote theo ID
router.get('/:id', quoteController.getById);

// Tạo quote mới
router.post('/', quoteController.create);

// Cập nhật quote
router.put('/:id', quoteController.update);

// Xóa quote
router.delete('/:id', quoteController.delete);


router.patch('/:id/approve', quoteController.approve);
router.patch('/:id/reject', quoteController.reject);


export default router;
