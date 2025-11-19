import db from '../config/db.js';

const partnerServiceJobModel = {
    create: async (partner_id, service_job_id, base_cost = null, note = null) => {
        const sql = `
            INSERT INTO partner_service_job (partner_id, service_job_id, base_cost, note, created_at)
            VALUES ($1, $2, $3, $4, now())
            RETURNING *;
        `;
        const result = await db.query(sql, [
            partner_id,
            service_job_id,
            base_cost,
            note,
        ]);

        return result.rows[0];
    },

    getAll: async () => {
        const sql = `
            SELECT psj.*, p.name AS partner_name, sj.name AS service_job_name
            FROM partner_service_job psj
            LEFT JOIN partner p ON p.id = psj.partner_id
            LEFT JOIN service_job sj ON sj.id = psj.service_job_id
            ORDER BY psj.id DESC;
        `;
        const result = await db.query(sql);
        return result.rows;
    },

    getByPartner: async (partner_id) => {
        const sql = `
            SELECT psj.*, sj.name AS service_job_name
            FROM partner_service_job psj
            LEFT JOIN service_job sj ON sj.id = psj.service_job_id
            WHERE psj.partner_id = $1;
        `;
        const result = await db.query(sql, [partner_id]);
        return result.rows;
    },

    getByServiceJob: async (service_job_id) => {
        const sql = `
            SELECT psj.*, p.name AS partner_name
            FROM partner_service_job psj
            LEFT JOIN partner p ON p.id = psj.partner_id
            WHERE psj.service_job_id = $1;
        `;
        const result = await db.query(sql, [service_job_id]);
        return result.rows;
    },
    update: async (id, base_cost = null, note = null) => {
        const sql = `
            UPDATE partner_service_job
            SET base_cost = $1,
                note = $2,
                updated_at = now()
            WHERE id = $3
            RETURNING *;
        `;
        const result = await db.query(sql, [base_cost, note, id]);
        return result.rows[0] || null;
    },
};
export default partnerServiceJobModel;