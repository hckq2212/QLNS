import opportunityController from '../controllers/opportunityController.js'
import express from 'express'
import checkToken from '../middleware/authMiddleware.js'
import requireRole from '../middleware/roleMiddleware.js'

const opportunityRoute = express.Router();

// List all - only allowed for role 'sale'
opportunityRoute.get('/', checkToken, opportunityController.getAllOpportunities);

opportunityRoute.get('/pending-opportunities', checkToken, opportunityController.getAllPendingOpportunities);

// Get single
opportunityRoute.get('/:id', checkToken, opportunityController.getById);

// Create
opportunityRoute.post('/', checkToken, opportunityController.create);

// Update
opportunityRoute.patch('/:id', checkToken, opportunityController.update);

// Delete
opportunityRoute.delete('/:id', checkToken, opportunityController.remove);

// Approve (requires auth and role 'bod')
opportunityRoute.post('/:id/approve', checkToken, requireRole('bod'), opportunityController.approve);

// Reject (requires auth and role 'bod')
opportunityRoute.post('/:id/reject', checkToken, requireRole('bod'), opportunityController.reject);
// Get by creator
opportunityRoute.get('/creator/:userId', checkToken, opportunityController.getByCreator);

export default opportunityRoute;