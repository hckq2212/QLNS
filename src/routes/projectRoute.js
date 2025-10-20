import express from 'express'
import projectController from '../controllers/projectController.js'
import checkToken from '../middleware/authMiddleware.js'
import requireRole from '../middleware/roleMiddleware.js'

const router = express.Router()

router.get('/', projectController.list)
router.post('/', projectController.create)
router.get('/status/:status', projectController.getByStatus)
router.get('/:id', projectController.getById)
router.patch('/:id',projectController.update)
router.post('/:id/assign-job', projectController.assignJob)
router.post('/:id/close', projectController.close)
router.patch('/:id/assign-team', projectController.assignTeam)
router.get('/contract/:contractId', projectController.getByContract)
// team lead ack endpoint
router.post('/:id/ack', projectController.ack)

export default router;
