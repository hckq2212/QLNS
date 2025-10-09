import express from 'express'
import userController from '../controllers/userController.js'
import checkToken from '../middleware/authMiddleware.js'
import requireRole from '../middleware/roleMiddleware.js'

const userRoute = express.Router()

// List users (admin only)
userRoute.get('/',  requireRole('bod'), userController.getAllUser)

// Get single user (admin or the user themselves)
userRoute.get('/:id', userController.getUserById)
userRoute.put('/:id',  userController.update)



export default userRoute;