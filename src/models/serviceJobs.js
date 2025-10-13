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
}

export default serviceJobs