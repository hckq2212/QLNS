import db from '../config/db.js';

const contracts = {
    async getAllContracts () {
        const result = await db.query('SELECT * FROM contract');
        return result.rows;
    },
    async getById () {
        const result = await db.query('SELECT * FROM contract WHERE id = $1',(id));
        return result.rows[0];
    },
    async getAllPendingContracts () {
        const result = await db.query("SELECT * FROM contract WHERE status = 'pending'")
        return result.rows;
    }
}
export default contracts;
