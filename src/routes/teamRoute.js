import express from 'express'
import teamController from '../controllers/teamController.js'

const teamRoute = express.Router();

teamRoute.get('/', teamController.getAll)
teamRoute.get('/:id', teamController.getById)
teamRoute.post('/', teamController.create)

export default teamRoute;