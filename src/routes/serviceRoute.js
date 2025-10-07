import serviceController from "../controllers/serviceController.js";
import express from 'express'

const serviceRoute = express.Router();

serviceRoute.get('/', serviceController.getAll);
serviceRoute.get('/:id', serviceController.getById);

export default serviceRoute;