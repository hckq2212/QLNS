import db from "../config/db.js";

const customers = {
    async getAll() {
        const result = await db.query('SELECT * FROM customer');
        return result.rows;
    },
}

export default customers;