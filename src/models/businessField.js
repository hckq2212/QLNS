import db from "../config/db.js";

const businessField = {
    async getAll() {
        const result = await db.query('SELECT * FROM business_field ORDER BY name ASC');
        return result.rows;
    },

    async getByCode(code) {
        const result = await db.query('SELECT * FROM business_field WHERE code = $1', [code]);
        return result.rows[0];
    },

    async create({ code, name }) {
        try {
            const result = await db.query(
                `INSERT INTO business_field (code, name)
                VALUES ($1, $2) RETURNING *`,
                [code, name]
            );
            return result.rows[0];
        } catch (err) {
            throw err;
        }
    },

    async update(code, fields = {}) {
        const allowed = ['name'];
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

        params.push(code);
        const sql = `UPDATE business_field SET ${setClauses.join(', ')} WHERE code = $${idx} RETURNING *`;
        const result = await db.query(sql, params);
        return result.rows[0];
    },

    async remove(code) {
        const result = await db.query('DELETE FROM business_field WHERE code = $1 RETURNING *', [code]);
        return result.rows[0];
    }
};

export default businessField;
