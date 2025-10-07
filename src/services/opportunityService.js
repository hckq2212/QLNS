import opportunities from '../models/opportunities.js'
import customers from '../models/customers.js';
import contracts from '../models/contracts.js'


const opportunityService = {
    getAllOpportunities: async () => {
        return await opportunities.getAll();
    },
    geAllPendingOpportunities: async () =>{
        return await opportunities.getAllPending();
    },
    getOpportunityById: async (id) => {
        if (!id) throw new Error('id required');
        return await opportunities.getById(id);
    },

    createOpportunity: async (payload) => {
        // minimal validation
        if (!payload) throw new Error('payload required');
        return await opportunities.create(payload);
    },

    updateOpportunity: async (id, fields) => {
        if (!id) throw new Error('id required');
        return await opportunities.update(id, fields);
    },

    deleteOpportunity: async (id) => {
        if (!id) throw new Error('id required');
        return await opportunities.remove(id);
    },

    approveOpportunity: async (id, approverId) => {
        if (!id || !approverId) throw new Error('id and approverId required');

        // Load opportunity first
        const op = await opportunities.getById(id);
        if (!op) throw new Error('Opportunity not found');
        if (op.status && op.status !== 'pending') throw new Error('Opportunity is not pending');

        // If opportunity has no customer_id, create a customer from customer_temp
        let customerId = op.customer_id;
        if (!customerId) {
            if (!op.customer_temp) throw new Error('No customer info to create customer');
            const createdCustomer = await customers.create(op.customer_temp);
            customerId = createdCustomer.id;
            // update opportunity.customer_id to point to created customer
            await opportunities.update(id, { customer_id: customerId });
        }

        // Approve opportunity (set status and approved_by)
        const approved = await opportunities.approve(id, approverId);
        if (!approved) throw new Error('Failed to approve opportunity');

        // Create contract linked to this opportunity and customer
        // Use expected_price or total_cost; fall back to 0
        const totalCost = op.expected_price || 0;
        const contract = await contracts.create(id, customerId, totalCost, approverId);

        // Return combined result
        return { opportunity: approved, contract };
    },
    rejectOpportunity: async (id, rejectorId) => {
        if (!id || !rejectorId) throw new Error('id and rejectorId required');
        return await opportunities.reject(id, rejectorId);
    },
    getOpportunitiesByCreator: async (createdBy) => {
        if (!createdBy) throw new Error('createdBy required');
        return await opportunities.getByCreator(createdBy);
    },

    getPendingOpportunities: async () => {
        return await opportunities.getPending();
    }
}

export default opportunityService;