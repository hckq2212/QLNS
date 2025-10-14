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
    createFromOpportunity: async (opportunityId, customerId, totalCost, totalRevenue, customerTemp, creatorId ) => {
        try{
            let cid = customerId;
            if (!cid) {
                // create customer from temp info and use its id
                const createdCustomer = await customers.create(customerTemp);
                cid = createdCustomer && createdCustomer.id;
            }          
            let computedTotalRevenue = 0;
            let computedTotalCost = 0;
            try {
                const rowsRes = await db.query(
                    `SELECT os.quantity, os.proposed_price,
                            s.base_cost AS service_base_cost,
                            sj.base_cost AS sj_base_cost
                     FROM opportunity_service os
                     LEFT JOIN service s ON s.id = os.service_id
                     LEFT JOIN service_job sj ON sj.id = os.service_job_id
                     WHERE os.opportunity_id = $1`,
                    [opportunityId]
                );
                const rows = rowsRes.rows || [];
                for (const r of rows) {
                    const qty = r.quantity != null ? Number(r.quantity) : 1;
                    const proposed = r.proposed_price != null ? Number(r.proposed_price) : 0;
                    // user requested proposed_price * quantity as total revenue
                    computedTotalRevenue += proposed * qty;

                    const baseUnit = (r.sj_base_cost != null ? Number(r.sj_base_cost) : (r.service_base_cost != null ? Number(r.service_base_cost) : 0));
                    computedTotalCost += baseUnit * qty;
                }
            } catch (e) {
                // if query fails, continue with provided totals (but log)
                console.warn('Failed to compute totals from opportunity_service, falling back to provided totals:', e);
            }

            const finalTotalRevenue = Number.isFinite(computedTotalRevenue) && computedTotalRevenue > 0 ? computedTotalRevenue : (Number(totalRevenue) || 0);
            const finalTotalCost = Number.isFinite(computedTotalCost) && computedTotalCost > 0 ? computedTotalCost : (Number(totalCost) || 0);

            const result = await contracts.create(opportunityId, cid, finalTotalCost, finalTotalRevenue, creatorId);
            return result;
        } catch (err) {
            console.log('contractService.create error:', err);
            throw err;
        }
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

    getServicesByContractId: async (contractId) => {
        // delegate to model which already exposes a flexible getServiceUsage
        const rows = await contracts.getServiceUsage(contractId);
        return rows;
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
    },
}

export default contractService;