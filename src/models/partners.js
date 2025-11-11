import db from '../config/db.js';

const partners = {
    async getAll() {
        const res = await db.query('SELECT * FROM partner ORDER BY created_at DESC');
        return res.rows;
    },

    async getById(id) {
        if (!id) return null;
        const res = await db.query('SELECT * FROM partner WHERE id = $1', [id]);
        return res.rows[0];
    },

    async create({ name = null, phone = null, email = null, company = null, address = null, note = null, status = 'active', created_by = null } = {}) {
        const res = await db.query(
            `INSERT INTO partner (name, phone, email, company, address, note, status, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [name, phone, email, company, address, note, status, created_by]
        );
        return res.rows[0];
    },

    async update(id, fields = {}) {
        const allowed = ['name', 'phone', 'email', 'company', 'address', 'note', 'status'];
        const set = [];
        const params = [];
        let idx = 1;
        for (const k of allowed) {
            if (Object.prototype.hasOwnProperty.call(fields, k)) {
                set.push(`${k} = $${idx}`);
                params.push(fields[k]);
                idx++;
            }
        }
        if (set.length === 0) return null;
        params.push(id);
        const sql = `UPDATE partner SET ${set.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`;
        const res = await db.query(sql, params);
        return res.rows[0];
    },

    async remove(id) {
        const res = await db.query('DELETE FROM partner WHERE id = $1 RETURNING *', [id]);
        return res.rows[0];
    }
};

export default partners;
