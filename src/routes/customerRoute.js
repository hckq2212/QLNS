import express from 'express'
import customerController from '../controllers/customerController.js'

const customerRoute = express.Router()


customerRoute.get('/available',customerController.getAvailableCustomers)
customerRoute.get('/',customerController.getAllCustomer)
customerRoute.get('/:id',customerController.getById)
customerRoute.patch('/:id', customerController.update)
customerRoute.post('/', customerController.create)
customerRoute.delete('/:id', customerController.removeCustomer)

export default customerRoute;