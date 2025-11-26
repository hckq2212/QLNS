import express from 'express';
import roleController from '../controllers/roleController.js';

const router = express.Router();

router.get('/', roleController.getAll);
router.post('/', roleController.create);
router.get('/:id', roleController.getById);
router.patch('/:id', roleController.update);
router.delete('/:id', roleController.remove);

export default router;
