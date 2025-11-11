import db from "../config/db.js";

const services = {
    getAll: async () => {
        const result = await db.query('SELECT * FROM service');
        return result.rows;
    },
    getById: async (id) => {
        const result = await db.query(
            'SELECT * FROM service WHERE id = $1',
            [id]
        )
        return result.rows[0];
    }
    ,
    create: async ({ name = null, code = null, price = null, description = null, duration = null } = {}) => {
        const result = await db.query(
            `INSERT INTO service (name, code, price, description, duration)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, code, price, description, duration]
        );
        return result.rows[0];
    },

    update: async (id, fields = {}) => {
        const allowed = ['name', 'code', 'price', 'description', 'duration'];
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