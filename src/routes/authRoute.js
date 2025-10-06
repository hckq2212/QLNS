import express from 'express'
import authController from '../controllers/authController.js'
import checkToken from '../middleware/authMiddleware.js'

const authRoute = express.Router()

authRoute.get('/', (req, res)=>{
    res.send("Hello")
})

authRoute.post('/register', authController.register )
authRoute.post('/login', authController.login )
authRoute.patch('/change-password',checkToken,authController.changePassword)
authRoute.post('/refresh-token', authController.refresh)

export default authRoute;