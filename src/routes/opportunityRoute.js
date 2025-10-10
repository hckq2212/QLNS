import opportunityController from '../controllers/opportunityController.js'
import express from 'express'
import checkToken from '../middleware/authMiddleware.js'
import requireRole from '../middleware/roleMiddleware.js'

const opportunityRoute = express.Router();

// List all - only allowed for role 'sale'
opportunityRoute.get('/' , opportunityController.getAllOpportunities);

// Get tất cả các cơ hội đang chờ duyệt
opportunityRoute.get('/pending-opportunities',  opportunityController.getAllPendingOpportunities);

// Get by creator
opportunityRoute.get('/creator/:userId', opportunityController.getByCreator);

// Get single
opportunityRoute.get('/:id',  opportunityController.getById);

// Create
opportunityRoute.post('/',  opportunityController.create);

// Update
opportunityRoute.patch('/:id', opportunityController.update);

// Delete
opportunityRoute.delete('/:id', opportunityController.remove);

// Approve (requires auth and role 'bod')
opportunityRoute.post('/:id/approve', requireRole('bod'), opportunityController.approve);

// Reject (requires auth and role 'bod')
opportunityRoute.post('/:id/reject', requireRole('bod'), opportunityController.reject);

// Submit draft opportunity to BOD (sale)
opportunityRoute.post('/:id/submit', requireRole('sale'), opportunityController.submit);

export default opportunityRoute;