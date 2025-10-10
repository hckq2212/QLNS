import contracts  from "../models/contracts.js";
import customers from "../models/customers.js";

const contractService = {
    getAll: async () => {
        const result = await contracts.getAllContracts();
        return result;
    },
    getAllPending: async () =>{
        const result = await contracts.getAllPendingContracts();
        return result;
    },
    getById: async (contractId) => {
        const result = await contracts.getById(contractId);
        return result;
    },
    create: async (opportunityId, customerId, totalCost, customerTemp, creatorId ) => {
        try{
            let cid = customerId;
            if (!cid) {
                // create customer from temp info and use its id
                const createdCustomer = await customers.create(customerTemp);
                cid = createdCustomer && createdCustomer.id;
            }

            const result = await contracts.create(opportunityId, cid, totalCost, creatorId);
            return result;
        } catch (err) {
            console.log('contractService.create error:', err);
            throw err;
        }
    }

    ,
    // create draft contract (used by Sale)
    createDraft: async (payload, createdBy) => {
        // payload: { opportunity_id, customer_id, proposal_file_url, description }
        const contractsModel = contracts;
        // reuse existing create but set status to draft via model directly
        const result = await contractsModel.create(payload.opportunity_id || null, payload.customer_id || null, payload.totalCost || 0, createdBy);
        // update proposal_file_url and status to draft
        if (result) {
            await contractsModel.update(result.id, { proposal_file_url: payload.proposal_file_url || null, status: 'draft' });
            return await contractsModel.getById(result.id);
        }
        return null;
    },

    updateStatus: async (id, status, actorId = null) => {
        // Use contracts model to update status; DB triggers may enforce rules (e.g. block approve)
        const updated = await contracts.updateStatus(id, status, actorId);
        return updated;
    },

    signContract: async (id, signedFileUrl) => {
        const updated = await contracts.signContract(id, signedFileUrl);
        return updated;
    },

    deployContract: async (id) => {
        // delegate to model-level deploy which we will ensure exists
        const updated = await contracts.deployContract(id);
        return updated;
    }
}

export default contractService;