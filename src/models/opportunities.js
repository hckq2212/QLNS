import db from "../config/db.js";

const opportunities = {
    async getAll() {
        const result = await db.query('SELECT * FROM opportunity ORDER BY created_at DESC');
        return result.rows;
    },
    async getAllPending() {
        const result = await db.query("SELECT * FROM opportunity WHERE status = 'waiting_bod_approval'");
        return result.rows;
    },
    async getById(id, forUpdate = false) {
        if (forUpdate) {
            const result = await db.query('SELECT * FROM opportunity WHERE id = $1 FOR UPDATE', [id]);
            return result.rows[0];
        }
        const result = await db.query('SELECT * FROM opportunity WHERE id = $1', [id]);
        return result.rows[0];
    },

    async create({ customer_id = null, customer_temp = null, expected_price = null, description = null, created_by = null, status = 'waiting_bod_approval' }) {
        // Default new opportunities to 'draft' to match expected business flow.
        // Some Postgres deployments may have an enum type that doesn't include
        // 'draft' yet; to avoid crashing in those environments, try the insert
        // and if Postgres returns an "invalid input value for enum" error,
        // retry with a compatible fallback ('pending').
        try {
            const result = await db.query(
                `INSERT INTO opportunity (customer_id, customer_temp, expected_price, description, created_by, status)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [customer_id, customer_temp, expected_price, description, created_by, status]
            );
            return result.rows[0];
        } catch (err) {
            // Postgres error for invalid enum input contains this phrase.
            const msg = (err && err.message) ? String(err.message) : '';
            if (msg.includes('invalid input value for enum') && msg.includes('opportunity_status')) {
                console.warn('opportunities.create: status value not recognized by DB enum, retrying with fallback status "pending". Consider running migrations to add missing enum values.');
                const fallback = 'pending';
                const result2 = await db.query(
                    `INSERT INTO opportunity (customer_id, customer_temp, expected_price, description, created_by, status)
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [customer_id, customer_temp, expected_price, description, created_by, fallback]
                );
                return result2.rows[0];
            }
            throw err;
        }
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
            "UPDATE opportunity SET status = 'approved', approved_by = $1, updated_at = now() WHERE id = $2 AND status = 'waiting_bod_approval' RETURNING *",
            [approverId, id]
        );
        return result.rows[0];
    },
    async reject(id, rejectorId) {
        // Only reject if opportunity currently pending
        const result = await db.query(
            "UPDATE opportunity SET status = 'rejected', approved_by = $1, updated_at = now() WHERE id = $2 AND status = 'waiting_bod_approval' RETURNING *",
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