import express from 'express'
import customerController from '../controllers/customerController.js'

const customerRoute = express.Router()

customerRoute.get('/',customerController.getAllCustomer)
customerRoute.get('/:id',customerController.getById)

export default customerRoute;