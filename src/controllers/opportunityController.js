import { json } from 'express';
import opportunityService from '../services/opportunityService.js';


const opportunityController = {
    getAllOpportunities: async (req, res) => {
        try {
            const result = await opportunityService.getAllOpportunities();
            return res.json(result);
        } catch (err) {
            console.error('getAllOpportunities error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getAllPendingOpportunities: async (req, res) => {
        try {
            const result = await opportunityService.getAllPendingOpportunities();
            return res.json(result);
        } catch (err) {
            console.error('getAllOpportunities error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    getById: async (req, res) => {
        try {
            const id = req.params.id;
            const op = await opportunityService.getOpportunityById(id);
            if (!op) return res.status(404).json({ error: 'Opportunity not found' });
            return res.json(op);
        } catch (err) {
            console.error('getById error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    create: async (req, res) => {
        try {
            const payload = req.body || {};
            // attach creator if authenticated
            if (req.user && req.user.id) payload.created_by = req.user.id;
            const created = await opportunityService.createOpportunity(payload);
            return res.status(201).json(created);
        } catch (err) {
            console.error('create error:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    update: async (req, res) => {
        try {
            const id = req.params.id;
            const fields = req.body || {};
            const updated = await opportunityService.updateOpportunity(id, fields);
            if (!updated) return res.status(404).json({ error: 'Opportunity not found or no fields to update' });
            return res.json(updated);
        } catch (err) {
            console.error('update error:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    remove: async (req, res) => {
        try {
            const id = req.params.id;
            const deleted = await opportunityService.deleteOpportunity(id);
            if (!deleted) return res.status(404).json({ error: 'Opportunity not found' });
            return res.json({ message: 'Deleted', item: deleted });
        } catch (err) {
            console.error('remove error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    approve: async (req, res) => {
        try {
            const id = req.params.id;
            const approverId = req.user && req.user.id;
            if (!approverId) return res.status(401).json({ error: 'Unauthorized' });
            // accept optional payment plan in request body: { debts: [{amount, due_date}], installments: n }
            const paymentPlan = req.body || {};
            const result = await opportunityService.approveOpportunity(id, approverId, paymentPlan);
            // result expected: { opportunity, contract }
            if (!result || !result.opportunity) {
                return res.status(404).json({ error: 'Opportunity not found or already approved/rejected' });
            }
            return res.json(result);
        } catch (err) {
            console.error('approve error:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },
    reject: async (req, res) => {
        try {
            const id = req.params.id;
            const rejectorId = req.user && req.user.id;
            if (!rejectorId) return res.status(401).json({ error: 'Unauthorized' });
            const rejected = await opportunityService.rejectOpportunity(id, rejectorId);
            if (!rejected) {
                return res.status(404).json({ error: 'Opportunity not found or already approved/rejected' });
            }
            return res.json(rejected);
        } catch (err) {
            console.error('reject error:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    getByCreator: async (req, res) => {
        try {
            const creatorId = req.params.userId || (req.user && req.user.id);
            if (!creatorId) return res.status(400).json({ error: 'creatorId required' });
            const list = await opportunityService.getOpportunitiesByCreator(creatorId);
            return res.json(list);
        } catch (err) {
            console.error('getByCreator error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export default opportunityController;