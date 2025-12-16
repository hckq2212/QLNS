import db from "../config/db.js";

const services = {
    getAll: async () => {
        const result = await db.query('SELECT * FROM service');
        return result.rows;
    },
    getById: async (id) => {
        const serviceRes = await db.query('SELECT * FROM service WHERE id = $1', [id]);
        const service = serviceRes.rows[0];
        if (!service) return null;

        const jobsRes = await db.query(`
            SELECT sj.*
            FROM service_job sj
            JOIN service_job_mapping map ON map.service_job_id = sj.id
            WHERE map.service_id = $1
        `, [id]);

        service.jobs = jobsRes.rows;
        return service;
    },
    
    create: async ({ name = null, description = null, code= null, output_job_id = null  } = {}) => {
        const result = await db.query(
            `INSERT INTO service (name, description, code, output_job_id )
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, description, code, output_job_id ]
        );
        
        return result.rows[0];
    },

    update: async (id, fields = {}) => {
        const allowed = ['name', 'base_price', 'description'];
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
        const sql = `UPDATE service SET ${setClauses.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`;
        const result = await db.query(sql, params);
        return result.rows[0];
    },

    remove: async (id) => {
        const result = await db.query('DELETE FROM service WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
}

export default services;