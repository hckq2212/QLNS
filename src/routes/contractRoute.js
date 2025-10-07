import contractController from "../controllers/contractController.js";
import express from 'express'
import checkToken from "../middleware/authMiddleware.js";


const contractRoute = express.Router();

// All contract routes require authentication because controllers expect req.user
contractRoute.use(checkToken);

contractRoute.get('/', contractController.getAll);
contractRoute.get('/pending', contractController.getAllPending);
contractRoute.get('/:id', contractController.getById);
contractRoute.post('/create', contractController.create);

export default contractRoute;