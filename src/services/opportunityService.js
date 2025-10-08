import opportunities from '../models/opportunities.js'
import db from '../config/db.js'
import opportunityServices from '../models/opportunityServices.js'


const opportunityService = {
    getAllOpportunities: async () => {
        return await opportunities.getAll();
    },
    getAllPendingOpportunities: async () =>{
        return await opportunities.getAllPending();
    },
    getOpportunityById: async (id) => {
        if (!id) throw new Error('id required');
        return await opportunities.getById(id);
    },

    createOpportunity: async (payload) => {
        // minimal validation
        if (!payload) throw new Error('payload required');

        // If services are provided, create opportunity and services in a transaction
        const services = payload.services || [];
        if (!services || services.length === 0) {
            return await opportunities.create(payload);
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            const createdOppRes = await client.query(
                `INSERT INTO opportunity (customer_id, customer_temp, expected_price, description, created_by)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [payload.customer_id || null, payload.customer_temp || null, payload.expected_price || null, payload.description || null, payload.created_by || null]
            );
            const createdOpp = createdOppRes.rows[0];

            // insert opportunity_service rows
            const createdServices = await opportunityServices.createMany(createdOpp.id, services, client);

            await client.query('COMMIT');
            createdOpp.services = createdServices;
            return createdOpp;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
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

        // Use a DB transaction to ensure atomicity: create customer (if needed),
        // update opportunity, approve, create contract and debt as one unit.
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // create customer if missing
            let customerId = op.customer_id;
            if (!customerId) {
                if (!op.customer_temp) throw new Error('No customer info to create customer');
                // minimal validation: ensure name exists
                const temp = op.customer_temp;
                if (!temp || (!temp.name && !temp.email && !temp.phone)) {
                    throw new Error('customer_temp missing required fields');
                }
                const custRes = await client.query(
                    'INSERT INTO customer(name, phone, email, company, note) VALUES($1,$2,$3,$4,$5) RETURNING *',
                    [temp.name || null, temp.phone || null, temp.email || null, temp.company || null, temp.note || null]
                );
                customerId = custRes.rows[0].id;
                // update opportunity.customer_id
                await client.query('UPDATE opportunity SET customer_id = $1, updated_at = now() WHERE id = $2', [customerId, id]);
            }

            // Approve opportunity (only if still pending)
            const approveRes = await client.query(
                "UPDATE opportunity SET status = 'approved', approved_by = $1, updated_at = now() WHERE id = $2 AND status = 'pending' RETURNING *",
                [approverId, id]
            );
            const approved = approveRes.rows[0];
            if (!approved) throw new Error('Opportunity not found or not pending');

            // Create contract linked to this opportunity and customer. We'll
            // populate jobs from opportunity_service afterwards so triggers
            // can recalculate totals.
            const contractRes = await client.query(
                "INSERT INTO contract (opportunity_id, customer_id, total_cost, created_by, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING *",
                [id, customerId, 0, approverId]
            );
            const contract = contractRes.rows[0];

            // Find all proposed services for this opportunity and create jobs
            const oppServicesRes = await client.query('SELECT * FROM opportunity_service WHERE opportunity_id = $1', [id]);
            const oppServices = oppServicesRes.rows || [];

            for (const s of oppServices) {
                // get service defaults
                const svcRes = await client.query('SELECT name, base_cost FROM service WHERE id = $1', [s.service_id]);
                const svc = svcRes.rows[0] || {};
                const quantity = s.quantity || 1;
                const proposed = s.proposed_price != null ? Number(s.proposed_price) : null;
                const baseCostPerUnit = svc.base_cost != null ? Number(svc.base_cost) : 0;

                // aggregate by quantity: set sale_price = proposed * quantity (fallback to base cost * quantity)
                const salePrice = proposed != null ? proposed * quantity : baseCostPerUnit * quantity;
                const baseCost = baseCostPerUnit * quantity;

                const jobName = svc.name || `Service ${s.service_id}`;
                const jobDesc = s.note || op.description || null;

                // assigned to approver by default (assigned_type 'user')
                await client.query(
                    `INSERT INTO job (contract_id, service_id, assigned_type, assigned_id, name, description, base_cost, external_cost, sale_price, status, progress_percent, created_by, created_at)
                     VALUES ($1,$2,'user',$3,$4,$5,$6,$7,$8,'pending',0,$9, now()) RETURNING *`,
                    [contract.id, s.service_id, approverId, jobName, jobDesc, baseCost, null, salePrice, approverId]
                );
            }

            // After inserting jobs, the DB trigger (trg_job_sync_contract) will
            // have updated contract.total_cost and contract.total_revenue. Re-fetch
            // the contract to get the updated totals.
            const refreshedContractRes = await client.query('SELECT * FROM contract WHERE id = $1', [contract.id]);
            const refreshedContract = refreshedContractRes.rows[0] || contract;

            // Create a debt for this contract with status 'pending' and amount = total_revenue
            const debtAmount = refreshedContract.total_revenue != null ? refreshedContract.total_revenue : 0;
            const debtRes = await client.query(
                'INSERT INTO debt (contract_id, amount, due_date, status) VALUES ($1, $2, $3, $4) RETURNING id, contract_id, amount, due_date, status',
                [contract.id, debtAmount, null, 'pending']
            );

            await client.query('COMMIT');

            return { opportunity: approved, contract: refreshedContract, debt: debtRes.rows[0] };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
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