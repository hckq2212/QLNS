import opportunityController from '../controllers/opportunityController.js'
import express from 'express'
import multer from 'multer';

const opportunityRoute = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }); 

// List all - only allowed for role 'sale'
opportunityRoute.get('/me' , opportunityController.getMyOpportunities);
opportunityRoute.get('/' , opportunityController.getAllOpportunities);
opportunityRoute.get('/:id/services', opportunityController.getService)

// Service management for opportunities
opportunityRoute.post('/:id/services', opportunityController.addService);
opportunityRoute.patch('/:id/services/:serviceId', opportunityController.updateService);
opportunityRoute.delete('/:id/services/:serviceId', opportunityController.deleteService);

// Get tất cả các cơ hội đang chờ duyệt
opportunityRoute.get('/status/:status',  opportunityController.getByStatus);
opportunityRoute.patch('/:id/quote', opportunityController.quote)

// Get by creator   
opportunityRoute.get('/creator/:userId', opportunityController.getByCreator);
    
// Get single
opportunityRoute.get('/:id',  opportunityController.getById);
// Create
opportunityRoute.post('/', upload.array('attachments', 5), opportunityController.create);

// Update
opportunityRoute.patch('/:id', opportunityController.update);

// Delete
opportunityRoute.delete('/:id', opportunityController.remove);

// Approve (requires auth and role 'bod')
opportunityRoute.post('/:id/approve', opportunityController.approve);

// Reject (requires auth and role 'bod')
opportunityRoute.post('/:id/reject', opportunityController.reject);

// Submit draft opportunity to BOD (sale)
opportunityRoute.post('/:id/submit', opportunityController.submit);

export default opportunityRoute;