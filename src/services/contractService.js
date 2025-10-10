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

    setContractNumberAndStatus: async (id, manualCode, actorId = null) => {
        // write the given code into contract.code and set status to waiting_hr_confirm
        // do a simple update: extract year/month and seq if the code follows SGMK-YY-MM-XXX format, otherwise store code as-is
        const parsed = String(manualCode).match(/SGMK-(\d{2})-(\d{2})-(\d{3})/);
        let fields = { status: 'waiting_hr_confirm' };
        if (parsed) {
            fields.code = manualCode;
            fields.code_year = parsed[1];
            fields.code_month = parsed[2];
            fields.code_seq = Number(parsed[3]);
        } else {
            fields.code = manualCode;
        }
        const updated = await contracts.update(id, fields);
        return updated;
    },

    deployContract: async (id) => {
        // delegate to model-level deploy which we will ensure exists
        const updated = await contracts.deployContract(id);
        return updated;
    }

    ,
    ackProject: async (projectId, userId) => {
        // simple wrapper to mark lead_ack_at
        const result = await contracts.updateProjectAck(projectId, userId);
        // after ack, if the related contract has legal_confirmed_at set, promote contract to 'executing'
        try {
            if (result && result.contract_id) {
                const contract = await contracts.getById(result.contract_id);
                if (contract && contract.legal_confirmed_at && contract.status !== 'executing') {
                    await contracts.updateStatus(contract.id, 'executing');
                }
            }
        } catch (err) {
            // non-fatal; log
            console.error('post-ack contract promotion error:', err);
        }
        return result;
    }
}

export default contractService;