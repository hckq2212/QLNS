import contractController from "../controllers/contractController.js";
import express from 'express'
import checkToken from "../middleware/authMiddleware.js";


const contractRoute = express.Router();

// All contract routes require authentication because controllers expect req.user
contractRoute.use(checkToken);

contractRoute.get('/', contractController.getAll);
contractRoute.get('/pending', contractController.getAllPending);
contractRoute.get('/:id', contractController.getById);
contractRoute.post('/', contractController.create);
contractRoute.patch('/:id/hr-confirm', contractController.hrConfirm);
contractRoute.patch('/:id/submit-bod', contractController.submitToBod);
contractRoute.patch('/:id/approve', contractController.approveByBod);
// HR sign the contract (accept POST body with signed_file_url)
contractRoute.post('/:id/sign', contractController.sign);
contractRoute.post('/:id/deploy', contractController.deploy);

export default contractRoute;