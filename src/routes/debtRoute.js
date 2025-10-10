import debtController  from "../controllers/debtController.js";
import express from 'express'
import checkToken from "../middleware/authMiddleware.js";
import debtPaymentController from "../controllers/debtPaymentController.js";

const debtRoute = express.Router();

debtRoute.get('/', debtController.getAll);
debtRoute.get('/:id', debtController.getById)
debtRoute.patch('/:id', checkToken, debtController.updateStatus);
debtRoute.patch('/:id/pay', checkToken, debtController.payPartial);
debtRoute.post('/debts/:id/pay', debtPaymentController.payPartial)
debtRoute.get('/debts/reminders', debtPaymentController.reminders)

export default debtRoute;