import jobController from "../controllers/jobController.js";
import express from 'express'


const jobRoute = express.Router();

jobRoute.get('/', jobController.getAll);
jobRoute.get('/:id', jobController.getById);

export default jobRoute;