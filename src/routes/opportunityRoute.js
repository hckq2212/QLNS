import opportunityController from '../controllers/opportunityController.js'
import express from 'express'
import checkToken from '../middleware/authMiddleware.js'

const opportunityRoute = express.Router();

opportunityRoute.get('/',checkToken, opportunityController.getAllTasks);


export default opportunityRoute;