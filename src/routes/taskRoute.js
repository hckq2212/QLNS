import taskController from '../controllers/taskController.js'
import express from 'express'
import checkToken from '../middleware/authMiddleware.js'

const taskRoute = express.Router()

taskRoute.get('/',checkToken, taskController.getAllTasks)

export default taskRoute