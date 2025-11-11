import serviceJobController from "../controllers/serviceJobController.js";
import express from 'express'

const serviceJobRoute = express.Router();
// place specific route before parameterized route
serviceJobRoute.get('/', serviceJobController.getAll);
serviceJobRoute.post('/', serviceJobController.create);
serviceJobRoute.get('/service/:id', serviceJobController.getByServiceId);
serviceJobRoute.get('/:id/services', serviceJobController.getServicesForJob);
serviceJobRoute.get('/:id', serviceJobController.getById);
serviceJobRoute.patch('/:id', serviceJobController.update);
serviceJobRoute.delete('/:id', serviceJobController.remove);

export default serviceJobRoute