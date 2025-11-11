import express from 'express'
import partnerController from '../controllers/partnerController.js'

const partnerRoute = express.Router();

partnerRoute.get('/', partnerController.getAll);
partnerRoute.post('/', partnerController.create);
partnerRoute.get('/:id', partnerController.getById);
partnerRoute.patch('/:id', partnerController.update);
partnerRoute.delete('/:id', partnerController.remove);

export default partnerRoute;
