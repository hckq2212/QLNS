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
}

export default services;