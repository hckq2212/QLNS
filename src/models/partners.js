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

    async create({ name = null,contact_name = null, phone = null, email = null,  address = null, note = null,  created_by = null, type } = {}) {
        const res = await db.query(
            `INSERT INTO partner (name,contact_name, phone, email, address, note, created_by, type)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [name,contact_name, phone, email,  address, note,  created_by, type]
        );
        return res.rows[0];
    },

    async update(id, fields = {}) {
        const allowed = ['name', 'phone', 'email', 'address', 'note', 'type', 'contact_name'];
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
