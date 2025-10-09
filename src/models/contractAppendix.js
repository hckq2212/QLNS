import db from '../config/db.js'

const contractAppendix = {
    async create({ contract_id, job_id = null, proposer_id = null, approver_id = null, description = null, cost_change = 0, sale_price_change = 0, status = 'pending', created_at = null } = {}) {
        const result = await db.query(
            'INSERT INTO contract_appendix (contract_id, job_id, proposer_id, approver_id, description, cost_change, sale_price_change, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8, coalesce($9, now())) RETURNING *',
            [contract_id, job_id, proposer_id, approver_id, description, cost_change, sale_price_change, status, created_at]
        );
        return result.rows[0];
    },

    async getById(id) {
        const result = await db.query('SELECT * FROM contract_appendix WHERE id = $1', [id]);
        return result.rows[0];
    },

    async listByContract(contractId) {
        const result = await db.query('SELECT * FROM contract_appendix WHERE contract_id = $1 ORDER BY id', [contractId]);
        return result.rows;
    },

    async approve(id, approverId) {
        // set status = 'approved' and approver_id
        const result = await db.query("UPDATE contract_appendix SET status = 'approved', approver_id = $1, approved_at = now() WHERE id = $2 AND status = 'pending' RETURNING *", [approverId, id]);
        return result.rows[0];
    }
}

export default contractAppendix;
