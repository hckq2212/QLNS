import db from "../config/db.js";

const opportunities = {
    async getAll() {
        const result = await db.query('SELECT * FROM opportunity ORDER BY created_at DESC');
        return result.rows;
    },
    async getAllPending() {
        const result = await db.query("SELECT * FROM opportunity WHERE status = 'pending'");
        return result.rows;
    },
    async getById(id) {
        const result = await db.query('SELECT * FROM opportunity WHERE id = $1 FOR UPDATE', [id]);
        return result.rows[0];
    },

    async create({ customer_id = null, customer_temp = null, expected_price = null, description = null, created_by = null }) {
        const result = await db.query(
            `INSERT INTO opportunity (customer_id, customer_temp, expected_price, description, created_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [customer_id, customer_temp, expected_price, description, created_by]
        );
        return result.rows[0];
    },

    async update(id, fields = {}) {
        const allowed = ['customer_id', 'customer_temp', 'expected_price', 'description', 'status', 'approved_by'];
        const setClauses = [];
        const params = [];
        let idx = 1;

        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(fields, key)) {
                setClauses.push(`${key} = $${idx}`);
                params.push(fields[key]);
                idx++;
            }
        }

        if (setClauses.length === 0) return null; // nothing to update

        params.push(id);
        const sql = `UPDATE opportunity SET ${setClauses.join(', ')} , updated_at = now() WHERE id = $${idx} RETURNING *`;
        const result = await db.query(sql, params);
        return result.rows[0];
    },

    async remove(id) {
        const result = await db.query('DELETE FROM opportunity WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    },

    async approve(id, approverId, conn = db) {
        // Only approve if opportunity currently pending
        // Accept an optional `conn` (client or pool) so callers can pass a
        // transaction client to run this update inside a larger transaction.
        const runner = conn || db;
        const result = await runner.query(
            "UPDATE opportunity SET status = 'approved', approved_by = $1, updated_at = now() WHERE id = $2 AND status = 'pending' RETURNING *",
            [approverId, id]
        );
        return result.rows[0];
    },
    async reject(id, rejectorId) {
        // Only reject if opportunity currently pending
        const result = await db.query(
            "UPDATE opportunity SET status = 'rejected', approved_by = $1, updated_at = now() WHERE id = $2 AND status = 'pending' RETURNING *",
            [rejectorId, id]
        );
        return result.rows[0];
    },

    async getByCreator(createdBy) {
        const result = await db.query('SELECT * FROM opportunity WHERE created_by = $1 ORDER BY created_at DESC', [createdBy]);
        return result.rows;
    },

    async getPending() {
        const result = await db.query("SELECT * FROM opportunity WHERE status = 'pending' ORDER BY created_at DESC");
        return result.rows;
    }
};

export default opportunities;