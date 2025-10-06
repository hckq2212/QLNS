import express from 'express'
import userController from '../controllers/userController.js'

const userRoute = express.Router()

userRoute.get('/', (req, res)=>{
    res.send("Hello")
})

userRoute.get('/getall',userController.getAllUser)

export default userRoute;