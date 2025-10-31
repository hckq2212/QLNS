import jobController from "../controllers/jobController.js";
import express from 'express'


const jobRoute = express.Router();


jobRoute.get('/', jobController.getAll);
jobRoute.get('/me', jobController.getMyJob)
jobRoute.get('/project/:projectId', jobController.getByProject)
jobRoute.patch('/:id/assign', jobController.assign)
jobRoute.get('/:id', jobController.getById);
jobRoute.patch('/:id', jobController.update);
jobRoute.post('/', jobController.create)


export default jobRoute;