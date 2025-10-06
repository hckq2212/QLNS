import opportunities from '../models/opportunities.js'


const opportunityService = {
    getAllOpportunities: async () => {
        return await opportunities.getAll();
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
        return await opportunities.approve(id, approverId);
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