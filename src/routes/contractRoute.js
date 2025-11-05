import contractController from "../controllers/contractController.js";
import express from 'express'
import checkToken from "../middleware/authMiddleware.js";
import multer from 'multer';


const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); 

const contractRoute = express.Router();

// All contract routes require authentication because controllers expect req.user
contractRoute.use(checkToken);

contractRoute.get('/', contractController.getAll);
contractRoute.post('/opportunity/:opportunityId', contractController.createFromOpportunity)
contractRoute.get('/:status', contractController.getByStatus);
contractRoute.get('/:id/services', contractController.getServices);
contractRoute.get('/:id', contractController.getById);
contractRoute.get('/:id/proposal-contract', contractController.getProposalContractUrl)
contractRoute.get('/:id/signed-contract', contractController.getSignedContractUrl)
contractRoute.patch('/:id/hr-confirm', contractController.hrConfirm);
contractRoute.patch('/:id/upload-contract', upload.single('proposalContract'), contractController.uploadProposalContract);
contractRoute.patch('/:id', contractController.update)
contractRoute.post('/:id/approve', contractController.approveByBod);

contractRoute.patch('/:id/sign',upload.single('signedContract'), contractController.sign);


export default contractRoute;