import db from "../config/db.js";

const serviceJobMapping = {
    getAll: async () => {
        const result = await db.query(`SELECT * FROM service_job_mapping`);
        return result.rows;
    },

    getByServiceId: async (serviceId) => {
        const result = await db.query(
            `SELECT * FROM service_job_mapping WHERE service_id = $1`,
            [serviceId]
        );
        return result.rows;
    },

    getByJobId: async (serviceJobId) => {
        const result = await db.query(
            `SELECT * FROM service_job_mapping WHERE service_job_id = $1`,
            [serviceJobId]
        );
        return result.rows;
    },

    create: async ({ service_id, service_job_id }) => {
        const result = await db.query(
            `INSERT INTO service_job_mapping (service_id, service_job_id)
             VALUES ($1, $2)
             ON CONFLICT (service_id, service_job_id) DO NOTHING
             RETURNING *`,
            [service_id, service_job_id]
        );
        return result.rows[0];
    },

    remove: async ({ service_id, service_job_id }) => {
        const result = await db.query(
            `DELETE FROM service_job_mapping
             WHERE service_id = $1 AND service_job_id = $2
             RETURNING *`,
            [service_id, service_job_id]
        );
        return result.rows[0];
    }
};

export default serviceJobMapping;
