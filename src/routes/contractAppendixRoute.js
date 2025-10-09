import express from 'express'
import contractAppendixController from '../controllers/contractAppendixController.js'
import checkToken from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', contractAppendixController.create) // staff create
router.post('/:id/approve', contractAppendixController.approve) // approver
router.get('/:id', contractAppendixController.getById)
router.get('/contract/:contractId', contractAppendixController.listByContract)

export default router;
