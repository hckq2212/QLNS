import serviceJobController from "../controllers/serviceJobController.js";
import express from 'express'

const serviceJobRoute = express.Router();
serviceJobRoute.get('/', serviceJobController.getAll);
serviceJobRoute.get('/:id', serviceJobController.getById);
serviceJobRoute.get('/service/:id', serviceJobController.getByServiceId);

export default serviceJobRoute