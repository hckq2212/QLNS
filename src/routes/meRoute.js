import express from 'express'
import meController from '../controllers/meController.js';

const meRoute = express.Router();
meRoute.get('/job', meController.getMyJob)

export default meRoute