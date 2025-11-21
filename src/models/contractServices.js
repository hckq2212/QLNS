import db from '../config/db.js';

const contractServices = {
    getById: async (id) => {
        const res = await db.query('SELECT * FROM contract_service WHERE id = $1', [id]);
        return res.rows[0] || null;
    },

    getAll: async () => {
        const res = await db.query('SELECT * FROM contract_service ORDER BY id DESC');
        return res.rows;
    },

    getByContract: async (contractId) => {
        const res = await db.query('SELECT * FROM contract_service WHERE contract_id = $1 ORDER BY id', [contractId]);
        return res.rows;
    },

    create: async (contract_id, service_id = null, service_job_id = null, qty = 1, sale_price = 0, cost_price = 0, created_by = null) => {
        const sql = `
            INSERT INTO contract_service
            (contract_id, service_id, service_job_id, qty, sale_price, cost_price, created_by, created_at, updated_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7, now(), now())
            RETURNING *
        `;
        const res = await db.query(sql, [contract_id, service_id, service_job_id, qty, sale_price, cost_price, created_by]);
        return res.rows[0] || null;
    },

    update: async (id, fields = {}) => {
        const normalizeJsonb = (v) => {
            if (v === undefined) return undefined;
            if (v === null) return null;
            if (typeof v === 'string') return v;
            try { return JSON.stringify(v); } catch { return v; }
        };

        const allowed = ['service_id','service_job_id','qty','sale_price','cost_price','result'];
        const set = [];
        const params = [];
        let idx = 1;
        for (const k of allowed) {
            if (!Object.prototype.hasOwnProperty.call(fields, k)) continue;
            if (k === 'result') {
                set.push(`${k} = $${idx}::jsonb`);
                params.push(normalizeJsonb(fields[k]));
            } else {
                set.push(`${k} = $${idx}`);
                params.push(fields[k]);
            }
            idx++;
        }
        if (set.length === 0) return null;
        params.push(id);
        const sql = `UPDATE contract_service SET ${set.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`;
        const res = await db.query(sql, params);
        return res.rows[0] || null;
    },

    remove: async (id) => {
        const res = await db.query('DELETE FROM contract_service WHERE id = $1 RETURNING *', [id]);
        return res.rows[0] || null;
    },

    // Append a result item to the jsonb `result` column (stored as array)
    appendResultLink: async (id, item) => {
        // read current
        const cur = await db.query('SELECT COALESCE(result, \'[]\'::jsonb) AS result FROM contract_service WHERE id = $1', [id]);
        if (!cur.rows[0]) return null;
        const current = Array.isArray(cur.rows[0].result) ? cur.rows[0].result : [];
        const next = current.concat([item]);

        const upd = await db.query(
            `UPDATE contract_service SET result = $1::jsonb, updated_at = now() WHERE id = $2 RETURNING *`,
            [JSON.stringify(next), id]
        );
        return upd.rows[0] || null;
    }
};

export default contractServices;
