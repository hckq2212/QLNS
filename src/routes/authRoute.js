import express from 'express'
import authController from '../controllers/authController.js'

const authRoute = express.Router()

authRoute.post('/register', authController.register )
authRoute.post('/login', authController.login )
authRoute.patch('/change-password',authController.changePassword)
authRoute.post('/refresh-token', authController.refresh)

export default authRoute;