import jobController from "../controllers/jobController.js";
import express from 'express'
import checkToken from '../middleware/authMiddleware.js'


const jobRoute = express.Router();

jobRoute.get('/', jobController.getAll);
jobRoute.get('/:id', jobController.getById);
jobRoute.patch('/:id', checkToken, jobController.update);

export default jobRoute;