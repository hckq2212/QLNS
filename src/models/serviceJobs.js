import db from "../config/db.js";

const serviceJobs = {
    getAll: async () => {
        const result = await db.query('SELECT * FROM service_job');
        return result.rows;
    },

    getById: async (id) => {
        const result = await db.query('SELECT * FROM service_job WHERE id = $1', [id]);
        return result.rows[0];
    },

    // 🔹 Đã sửa: Lấy service_job theo service_id thông qua bảng mapping
    getByServiceId: async (serviceId) => {
        const result = await db.query(`
            SELECT sj.*
            FROM service_job sj
            JOIN service_job_mapping map ON map.service_job_id = sj.id
            WHERE map.service_id = $1
        `, [serviceId]);
        return result.rows;
    },

    // 🔹 Đã bỏ service_id khỏi create
    create: async ({ name, description, base_cost, owner_type = 'user', partner_id = null } = {}) => {
        const result = await db.query(
            `INSERT INTO service_job (name, description, base_cost, owner_type, partner_id, updated_at)
             VALUES ($1, $2, $3, $4, $5, now()) RETURNING *`,
            [name, description, base_cost, owner_type, partner_id]
        );
        return result.rows[0];
    },

    update: async (id, fields = {}) => {
        const allowed = ['name', 'description', 'base_cost', 'owner_type', 'partner_id'];
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
    },
    getServicesForJob: async (serviceJobId) => {
        const result = await db.query(`
            SELECT s.*
            FROM service s
            JOIN service_job_mapping m ON m.service_id = s.id
            WHERE m.service_job_id = $1
            ORDER BY s.name NULLS LAST
        `, [serviceJobId]);
        return result.rows;
        }
};

export default serviceJobs;
