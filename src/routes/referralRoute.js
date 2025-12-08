// routes/referralRoute.js
import express from 'express';
import referralController from '../controllers/referralController.js';

const router = express.Router();

// GET /api/referral?keyword=...&active=true
router.get('/', referralController.list);

// GET /api/referral/:id
router.get('/:id', referralController.detail);

// POST /api/referral
router.post('/', referralController.create);

// PUT /api/referral/:id
router.put('/:id', referralController.update);

// DELETE /api/referral/:id (soft delete: is_active = false)
router.delete('/:id', referralController.softDelete);

// GET /api/referral/:id/customers -> list khách hàng của ref
router.get('/:id/customers', referralController.listCustomers);

export default router;
