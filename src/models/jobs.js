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

    ,

    async create(payload, conn = db) {
        // payload: { project_id, name, start_date, end_date }
        const client = conn === db ? await db.connect() : conn;
        try {
            // check project lead ack
            const pRes = await client.query('SELECT lead_ack_at FROM project WHERE id = $1', [payload.project_id]);
            if (!pRes.rows || pRes.rows.length === 0) throw new Error('project not found');
            const leadAck = pRes.rows[0].lead_ack_at;
            if (!leadAck) throw new Error('project lead must acknowledge before creating jobs');

            // validate dates
            if (payload.start_date && payload.end_date) {
                const s = new Date(payload.start_date);
                const e = new Date(payload.end_date);
                if (s > e) throw new Error('start_date must be <= end_date');
            }

            const result = await client.query('INSERT INTO job (project_id, name, start_date, end_date, created_at) VALUES ($1, $2, $3, $4, now()) RETURNING *', [payload.project_id, payload.name, payload.start_date || null, payload.end_date || null]);
            return result.rows[0];
        } finally {
            if (client && client.release && conn === db) client.release();
        }
    }

    ,

    async update(id, fields = {}, conn = db) {
        if (!id) throw new Error('id required');
        const allowed = ['status', 'progress_percent', 'external_cost'];
        const sets = [];
        const vals = [];
        let idx = 1;
        for (const k of Object.keys(fields)) {
            if (!allowed.includes(k)) continue;
            sets.push(`${k} = $${idx}`);
            vals.push(fields[k]);
            idx++;
        }
        if (sets.length === 0) throw new Error('no updatable fields provided');
        // append updated_at
        sets.push(`updated_at = now()`);
        const q = `UPDATE job SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
        vals.push(id);

        let client = conn;
        let usedClient = null;
        try {
            if (conn === db) {
                usedClient = await db.connect();
                client = usedClient;
            }
            const result = await client.query(q, vals);
            return result.rows[0];
        } finally {
            if (usedClient && usedClient.release) usedClient.release();
        }
    }
}

export default jobs;