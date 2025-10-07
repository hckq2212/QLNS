import db from "../config/db.js";

const debts = {
    getAll: async () => {
        const result = await db.query("SELECT id, contract_id, amount, due_date, status from debt");
        return result.rows;
    },
    getById: async (id) => {
        const result = await db.query(
            "SELECT id, contract_id, amount, due_date, status from debt WHERE id = $1",
            [id]
        );
        return result.rows[0];
    }
}
export default debts;