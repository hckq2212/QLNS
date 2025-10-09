import debtController  from "../controllers/debtController.js";
import express from 'express'
import checkToken from "../middleware/authMiddleware.js";

const debtRoute = express.Router();

debtRoute.get('/', debtController.getAll);
debtRoute.get('/:id', debtController.getById)
debtRoute.patch('/:id', checkToken, debtController.updateStatus);
debtRoute.patch('/:id/pay', checkToken, debtController.payPartial);

export default debtRoute;