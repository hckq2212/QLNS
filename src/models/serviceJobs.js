import db from "../config/db.js";

const serviceJobs = {
    getAll: async () => {
        const result = await db.query('SELECT * FROM service_job');
        return result.rows;
    },
    getById: async (id) => {
        const result = await db.query('SELECT * FROM service_job WHERE id = $1',[id])
        return result.rows[0];
    },
    getByServiceId: async (id) => {
        const result = await db.query('SELECT * FROM service_job WHERE service_id = $1',[id]);
        return result.rows
    }

    ,
    create: async ({ service_id = null, name = null, description = null, base_cost = null, duration = null, created_by = null } = {}) => {
        const result = await db.query(
            `INSERT INTO service_job (service_id, name, description, base_cost, duration, created_by, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6, now(), now()) RETURNING *`,
            [service_id, name, description, base_cost, duration, created_by]
        );
        return result.rows[0];
    },

    update: async (id, fields = {}) => {
        const allowed = ['service_id', 'name', 'description', 'base_cost', 'duration'];
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
        const sql = `UPDATE service_job SET ${setClauses.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`;
        const result = await db.query(sql, params);
        return result.rows[0];
    },

    remove: async (id) => {
        const result = await db.query('DELETE FROM service_job WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
}

export default serviceJobs