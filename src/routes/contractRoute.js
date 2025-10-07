import contractController from "../controllers/contractController.js";
import express from 'express'
import checkToken from "../middleware/authMiddleware.js";



const contractRoute = express.Router();

contractRoute.get('/', contractController.getAll);
contractRoute.get('/pending', contractController.getAllPending);
contractRoute.get('/:id', contractController.getById);
contractRoute.post('/create', contractController.create);



export default contractRoute;