import db from "../config/db.js";

const debts = {
    getAll: async () => {
        const result = await db.query("SELECT id, contract_id, amount, due_date,title, status from debt");
        return result.rows;
    },
    getById: async (id) => {
        const result = await db.query(
            "SELECT id, contract_id, amount, due_date, title, status from debt WHERE id = $1",
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
    async create(contractId, amount, dueDate,  title) {
        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt <= 0) throw new Error('amount must be positive');
        try {
            const result = await db.query(
                `INSERT INTO debt (contract_id, amount, due_date, status, title) VALUES ($1, $2, $3,'pending', $4 ) RETURNING *`,
                [contractId, amt, dueDate, title]
            );
            return result.rows[0];
        } catch (err) {
            console.error('debts.create DB error:', err && (err.stack || err.message) || err);
            throw err;
        }
    },
    

    // find debts that need reminders or overdue handling
    async findDebtsForReminders() {
        // returns debts with due_date not null and status = 'pending'
        const result = await db.query("SELECT * FROM debt WHERE due_date IS NOT NULL AND status = 'pending'");
        return result.rows;
    },
    async getDebtByContractId(id) {
        const result = await db.query('Select * FROM debt WHERE contract_id = $1 ', [id]);
        return result.rows;
    },
}
export default debts;