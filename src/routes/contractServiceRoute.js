import express from 'express';
import contractServiceController from '../controllers/contractServiceController.js';

const router = express.Router();

// Lưu link vào contract_service.result
router.post('/:id/result', contractServiceController.saveResult);
router.get('/', contractServiceController.getAll);
router.post('/', contractServiceController.create);
router.get('/contract/:contractId', contractServiceController.getByContract);
router.get('/:id', contractServiceController.getById);
router.patch('/:id', contractServiceController.update);
router.put('/:id/result/:index', contractServiceController.updateResultItem);
router.delete('/:id/result/:index', contractServiceController.deleteResultItem);
router.delete('/:id', contractServiceController.remove);



export default router;

