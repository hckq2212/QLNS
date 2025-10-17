import db from '../config/db.js'

const projects = {
    async getAll() {
        const result = await db.query('SELECT * FROM project ORDER BY created_at DESC');
        return result.rows;
    },

    async getById(id) {
        const result = await db.query('SELECT * FROM project WHERE id = $1', [id]);
        return result.rows[0];
    },
    async getByStatus(status){
        const result = await db.query('SELECT * FROM project WHERE status = $1',[status])
        return result.rows;
    },

    async create({ contract_id = null, name = null, description = null, start_date = null, end_date = null, status = 'planned', created_by = null } = {}) {
        const result = await db.query(
            'INSERT INTO project (contract_id, name, description, start_date, end_date, status, created_by, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7, now()) RETURNING *',
            [contract_id, name, description, start_date, end_date, status, created_by]
        );
        return result.rows[0];
    },
    async getByContract(contractId){
        const result = await db.query(
            `SELECT * FROM project WHERE contract_id = $1`,
            [contractId]
        )
        return result.rows[0]
    },

    async update(id, fields = {}) {
        const allowed = ['name','description','start_date','end_date','status','created_by'];
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
        const sql = `UPDATE project SET ${setClauses.join(', ')} , created_at = coalesce(created_at, now()) WHERE id = $${idx} RETURNING *`;
        const result = await db.query(sql, params);
        return result.rows[0];
    },

    async getJobs(projectId) {
        const result = await db.query('SELECT * FROM job WHERE project_id = $1 ORDER BY id', [projectId]);
        return result.rows;
    },
    async assignTeam(id, teamId){
        const result = await db.query(
            `UPDATE project
             SET team_id = $1
             WHERE id = $2
             RETURNING *
            `,
            [teamId, id]
        )
        return result.rows[0]
    }
}

export default projects;
