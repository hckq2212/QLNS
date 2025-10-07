import db from '../config/db.js'

const jobs = {
    getAll: async () => {
        const result = await db.query("SELECT * FROM job");
        return result.rows;
    },
    getById: async (id) => {
        const result = await db.query("SELECT * FROM job WHERE id = $1",[id]);
        return result.rows[0];
    }
}

export default jobs;