import db from '../config/db.js';

const contracts = {
    async getAllContracts () {
        const result = await db.query('SELECT * FROM contract');
        return result.rows;
    },
    async getById (id) {
        const result = await db.query('SELECT * FROM contract WHERE id = $1',[id]);
        return result.rows[0];
    },
    async getAllPendingContracts () {
        const result = await db.query("SELECT * FROM contract WHERE status = 'pending'")
        return result.rows;
    },
    async create (opportunityId, customerId, totalCost, creatorId) {
        const result = await db.query(
            "INSERT INTO contract (opportunity_id, customer_id, total_cost, created_by, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING *",
            [opportunityId, customerId, totalCost, creatorId]
        );
        return result.rows[0];
    }
}
export default contracts;
