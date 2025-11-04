import debtController  from "../controllers/debtController.js";
import express from 'express'
import checkToken from "../middleware/authMiddleware.js";
import debtPaymentController from "../controllers/debtPaymentController.js";

const debtRoute = express.Router();

debtRoute.get('/', debtController.getAll);
debtRoute.get('/:id', debtController.getById)
debtRoute.patch('/:id', debtController.updateStatus);
debtRoute.get('/debts/reminders', debtPaymentController.reminders)
debtRoute.post('/', debtController.create)
debtRoute.post('/:contractId', debtController.createForContract)

export default debtRoute;