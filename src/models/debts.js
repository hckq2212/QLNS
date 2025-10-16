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
    async create(contractId, amount, dueDate, status = 'pending') {
        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt <= 0) throw new Error('amount must be positive');
        try {
            const result = await db.query(
                'INSERT INTO debt (contract_id, amount, due_date, status) VALUES ($1, $2, $3, $4) RETURNING *',
                [contractId, amt, dueDate, status]
            );
            return result.rows[0];
        } catch (err) {
            console.error('debts.create DB error:', err && (err.stack || err.message) || err);
            throw err;
        }
    },
    async payPartial(id, payAmount = 0) {
        if (!id) throw new Error('id required');

        const amountToPay = Number(payAmount);
        if (!Number.isFinite(amountToPay) || amountToPay <= 0) {
            throw new Error('payAmount must be positive');
        }

        // Use a transaction to avoid races
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            // also select status and paid_at so we don't accidentally overwrite them with NULL
            const curRes = await client.query('SELECT id, amount, paid_amount, status, paid_at FROM debt WHERE id = $1 FOR UPDATE', [id]);
            if (!curRes.rows || curRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }
            const row = curRes.rows[0];
            const currentPaid = row.paid_amount != null ? Number(row.paid_amount) : 0;
            const total = row.amount != null ? Number(row.amount) : 0;
            let newPaid = currentPaid + amountToPay;
            let newStatus = row.status;
            let paidAt = null;
            if (newPaid >= total) {
                newPaid = total;
                newStatus = 'paid';
                paidAt = new Date();
            }
            const upd = await client.query('UPDATE debt SET paid_amount = $1, paid_at = COALESCE($2, paid_at), status = $3 WHERE id = $4 RETURNING id, contract_id, amount, paid_amount, paid_at, status', [newPaid, paidAt, newStatus, id]);
            await client.query('COMMIT');
            return upd.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
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