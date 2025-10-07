import db from "../config/db.js";

const debts = {
    getAll: async () => {
        const result = await db.query("SELECT id, contract_id, amount, due_date, status from debt");
        return result.rows;
    },
    getById: async (id) => {
        const result = await db.query(
            "SELECT id, contract_id, amount, due_date, status from debt WHERE id = $1",
            [id]
        );
        return result.rows[0];
    },
    updateStatus: async (id, status) => {
        const result = await db.query(
            "UPDATE debt SET status = $1 WHERE id = $2 RETURNING id, contract_id, amount, due_date, status",
            [status,id]
        );
        return result.rows[0];
    }
    ,
    async create(contractId, amount = 0, dueDate = null, status = 'pending') {
        const result = await db.query(
            'INSERT INTO debt (contract_id, amount, due_date, status) VALUES ($1, $2, $3, $4) RETURNING id, contract_id, amount, due_date, status',
            [contractId, amount, dueDate, status]
        );
        return result.rows[0];
    }
}
export default debts;