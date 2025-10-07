import express from 'express'
import customerController from '../controllers/customerController.js'

const customerRoute = express.Router()

customerRoute.get('/',customerController.getAllCustomer)


export default customerRoute;