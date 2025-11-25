import debtController  from "../controllers/debtController.js";
import express from 'express'


const debtRoute = express.Router();

debtRoute.get('/', debtController.getAll);
debtRoute.get('/:id', debtController.getById)
debtRoute.patch('/:id', debtController.updateStatus);
debtRoute.post('/', debtController.create)
debtRoute.post('/:contractId', debtController.createForContract)
// get debts for a specific contract
debtRoute.get('/contract/:contractId', debtController.getByContract);

export default debtRoute;