import express from 'express'
import partnerController from '../controllers/partnerController.js'

const router = express.Router();

router.get('/', partnerController.getAll);
router.post('/', partnerController.create);
router.get('/:id', partnerController.getById);
router.patch('/:id', partnerController.update);
router.delete('/:id', partnerController.remove);

export default router;
