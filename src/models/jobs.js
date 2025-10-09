import db from '../config/db.js'

const jobs = {
    getAll: async () => {
        const result = await db.query("SELECT * FROM job");
        return result.rows;
    },
    getById: async (id) => {
        const result = await db.query("SELECT * FROM job WHERE id = $1",[id]);
        return result.rows[0];
    },
    // assign a job to a user or partner
    // assignedType: 'user' or 'partner'
    async assign(assignedType, assignedId, jobId, conn = db) {
        if (!jobId) throw new Error('jobId required');
        if (!assignedType || (assignedType !== 'user' && assignedType !== 'partner')) throw new Error('assignedType must be "user" or "partner"');

        const runner = conn;

        // validate target exists
        if (assignedType === 'user') {
            const u = await runner.query('SELECT id FROM "user" WHERE id = $1', [assignedId]);
            if (!u.rows || u.rows.length === 0) throw new Error(`user id ${assignedId} not found`);
        } else {
            const p = await runner.query('SELECT id FROM partner WHERE id = $1', [assignedId]);
            if (!p.rows || p.rows.length === 0) throw new Error(`partner id ${assignedId} not found`);
        }

        const result = await runner.query('UPDATE job SET assigned_type = $1, assigned_id = $2, updated_at = now() WHERE id = $3 RETURNING *', [assignedType, assignedId, jobId]);
        return result.rows[0];
    }
}

export default jobs;