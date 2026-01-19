import db from "../config/db.js";

const opportunities = {
    async getAll() {
        const result = await db.query('SELECT * FROM opportunity ORDER BY created_at DESC');
        return result.rows;
    },
    async getByStatus(status) {
        const result = await db.query("SELECT * FROM opportunity WHERE status = $1", [status]);
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

    async create({expected_revenue, expected_budget, success_rate, expected_end_date, priority, name, region, expected_price = null, description = null, created_by = null, status = 'waiting_bod_approval',implementation_months,estimated_start_date }) {
        try {
            const result = await db.query(
                `INSERT INTO opportunity (expected_revenue, expected_budget, success_rate, expected_end_date, priority, name, region, expected_price, description, created_by, status,implementation_months, estimated_start_date)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
                [expected_revenue, expected_budget, success_rate, expected_end_date, priority, name, region, expected_price, description, created_by, status,implementation_months, estimated_start_date]
            );
            return result.rows[0];
        } catch (err) {
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

    async approve(id, approverId) {
        const result = await db.query(
            "UPDATE opportunity SET status = 'approved', approved_by = $1, updated_at = now(), bod_approved = true WHERE id = $2 AND status = 'waiting_bod_approval' RETURNING *",
            [approverId, id]
        );
        return result.rows[0];
    },
    async reject(id, rejectorId) {
        // Only reject if opportunity currently pending
        const result = await db.query(
            "UPDATE opportunity SET status = 'rejected', approved_by = $1, updated_at = now(), bod_approved = true WHERE id = $2 AND status = 'waiting_bod_approval' RETURNING *",
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