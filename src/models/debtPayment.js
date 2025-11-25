import db from "../config/db.js";

const debtPayment = {
    create: async (debtId, { paid_amount, paid_at, method, note }) => {
        const sql = `
            INSERT INTO debt_payment (debt_id, paid_amount, paid_at, method, note)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const { rows } = await db.query(sql, [
            debtId,
            paid_amount,
            paid_at || new Date(),
            method || null,
            note || null
        ]);
        return rows[0];
    },

    getByDebt: async (debtId) => {
        const sql = `SELECT * FROM debt_payment WHERE debt_id = $1 ORDER BY paid_at ASC`;
        const { rows } = await db.query(sql, [debtId]);
        return rows;
    },

    update: async (paymentId, fields) => {
        const keys = Object.keys(fields);
        if (!keys.length) return null;

        const setSql = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
        const params = Object.values(fields);

        const sql = `
            UPDATE debt_payment
            SET ${setSql}
            WHERE id = $${keys.length + 1}
            RETURNING *;
        `;

        const { rows } = await db.query(sql, [...params, paymentId]);
        return rows[0];
    },

    remove: async (paymentId) => {
        await db.query(`DELETE FROM debt_payment WHERE id = $1`, [paymentId]);
        return true;
    }
};
export default debtPayment