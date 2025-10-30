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
    update: async (id, fields = {}) => {
          const allowed = [
            'assigned_type',
            'assigned_id',
            'description',
            'external_cost',
            'status',
            'start_date',
            'end_date',
            'deadline'
        ];
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
        if (setClauses.length === 0) return null;
        params.push(id);
        const sql = `UPDATE job SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    getByProject: async(id) => {
        const result = await db.query('SELECT * FROM job WHERE project_id = $1',
            [id]
        )
        return result.rows
    },
    getMyJob: async (id) => {
        const result = await db.query(
            `
            SELECT * FROM job
            WHERE assigned_id = $1 
            AND assigned_type = 'user'
            `,
            [id]
        )
        return result.rows;
    }
}

export default jobs;