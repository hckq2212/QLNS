import express from 'express'
import cusomerController from '../controllers/customerController.js'

const customerRoute = express.Router()

customerRoute.get('/',cusomerController.getAllCustomer)

export default customerRoute;