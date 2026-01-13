import express from 'express'
import userController from '../controllers/userController.js'


const userRoute = express.Router()

userRoute.get('/me', userController.getPersonalInfo)
userRoute.get('/', userController.getAllUser)
userRoute.get('/:id/jobs', userController.getJobByUserId)
userRoute.get('/:id', userController.getUserById)
userRoute.patch('/:id',  userController.update)



export default userRoute;