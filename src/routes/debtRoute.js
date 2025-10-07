import debtController  from "../controllers/debtController.js";
import express from 'express'

const debtRoute = express.Router();

debtRoute.get('/', debtController.getAll);
debtRoute.get('/:id', debtController.getById)

export default debtRoute;