import serviceController from "../controllers/serviceController.js";
import express from 'express'

const serviceRoute = express.Router();

// CRUD routes for services
serviceRoute.get('/', serviceController.getAll);
serviceRoute.post('/', serviceController.create);
serviceRoute.get('/:id', serviceController.getById);
serviceRoute.patch('/:id', serviceController.update);
serviceRoute.delete('/:id', serviceController.remove);

export default serviceRoute;