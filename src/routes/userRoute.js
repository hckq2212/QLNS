import express from 'express'
import userController from '../controllers/userController.js'


const userRoute = express.Router()

// List users (admin only)
userRoute.get('/', userController.getAllUser)

// Get single user (admin or the user themselves)
userRoute.get('/:id', userController.getUserById)
userRoute.patch('/:id',  userController.update)



export default userRoute;