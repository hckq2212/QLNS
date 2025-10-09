import express from 'express'
import projectController from '../controllers/projectController.js'

const router = express.Router()

router.get('/', projectController.list)
router.post('/', projectController.create)
router.get('/:id', projectController.getById)
router.post('/:id/assign-job', projectController.assignJob)
router.post('/:id/close', projectController.close)

export default router;
