import opportunities from '../models/opportunities.js'
import customers from '../models/customers.js';
import contracts from '../models/contracts.js'
import debtService from './debtService.js';
import db from '../config/db.js'


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

            // Create contract linked to this opportunity and customer
            const totalCost = op.expected_price || 0;
            const contractRes = await client.query(
                "INSERT INTO contract (opportunity_id, customer_id, total_cost, created_by, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING *",
                [id, customerId, totalCost, approverId]
            );
            const contract = contractRes.rows[0];

            // Create a debt for this contract with status 'pending'
            const debtRes = await client.query(
                'INSERT INTO debt (contract_id, amount, due_date, status) VALUES ($1, $2, $3, $4) RETURNING id, contract_id, amount, due_date, status',
                [contract.id, totalCost, null, 'pending']
            );

            await client.query('COMMIT');

            return { opportunity: approved, contract, debt: debtRes.rows[0] };
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