import db from "../config/db.js";

const customers = {
    async getAll() {
        const result = await db.query('SELECT * FROM customer');
        return result.rows;
    },
    async getById(id){
        const result = await db.query('SELECT * FROM customer WHERE id = $1',[id]);
        return result.rows[0]
    },
      async create({ name = null, phone = null, email = null, address = null, identity_code = null, status } = {}) {
        const res = await db.query(
            `INSERT INTO customer (name, phone, email, address, identity_code,status )
             VALUES ($1,$2,$3,$4,$5, $6 ) RETURNING *`,
            [name, phone, email, address, identity_code, status]
        );
        return res.rows[0];
    },
    async update(id, fields = {}) {
        const allowed = ['name', 'phone', 'email', 'company', 'address', 'note', 'identity_code', 'status'];
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
        const sql = `UPDATE customer SET ${set.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`;
        const res = await db.query(sql, params);
        return res.rows[0];
    },
    async remove(id) {
        const res = await db.query('DELETE FROM customer WHERE id = $1 RETURNING *', [id]);
        return res.rows[0];
    }
}

export default customers;