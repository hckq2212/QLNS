import db from '../config/db.js';

const contracts = {
    async getAllContracts () {
        const result = await db.query('SELECT * FROM contract');
        return result.rows;
    },
    async getById (id) {
        const result = await db.query('SELECT * FROM contract WHERE id = $1',[id]);
        return result.rows[0];
    },
    async getAllPendingContracts () {
        const result = await db.query("SELECT * FROM contract WHERE status = 'waiting_hr_confirm'")
        return result.rows;
    },
    async uploadProposalContract (url, id) {
        const result = await db.query(
            `UPDATE contract
             SET proposal_file_url = $1,
                 updated_at = now()
             WHERE id = $2
             RETURNING *`,
            [url, id]
        );
        return result.rows[0];
    },
    async getContractsWithoutDebt(status = null) {
        let sql = 'SELECT * FROM contract c WHERE NOT EXISTS (SELECT 1 FROM debt d WHERE d.contract_id = c.id)';
        const params = [];
        if (status) {
            params.push(status);
            sql += ' AND c.status = $1';
        }
        sql += ' ORDER BY c.created_at DESC';
        const res = await db.query(sql, params);
        return res.rows;
    },
    async create(opportunity_id, customer_id, total_cost, total_revenue, created_by, created) {
        const result = await db.query(
            `INSERT INTO contract(
             opportunity_id, customer_id, total_cost, total_revenue, status, created_by, created_at
             )VALUES ($1, $2, $3, $4, $5, $6, now())
             RETURNING *
            `,
            [opportunity_id, customer_id, total_cost, total_revenue,  "without_debt", created_by]
        
        )
        return result.rows;
    },
    async updateStatus(id, status, approverId = null) {
        const result = await db.query(
            `UPDATE contract
             SET status = $2,
                 approved_by = $3,
                 updated_at = now()
             WHERE id = $1
             RETURNING *`,
            [id, status, approverId]
        );
        return result.rows[0];
    },
    async signContract(id, signedFileUrl) {
        if (!id) throw new Error('id required');
        // Idempotent: if already signed with the same file URL, return existing row without updating timestamps
        const cur = await db.query('SELECT id, signed_file_url, legal_confirmed_at FROM contract WHERE id = $1', [id]);
        if (cur.rows && cur.rows.length > 0) {
            const row = cur.rows[0];
            if (row.signed_file_url && row.signed_file_url === signedFileUrl) {
                return row; // unchanged
            }
        }
        const result = await db.query('UPDATE contract SET signed_file_url = $1, legal_confirmed_at = now(), updated_at = now() WHERE id = $2 RETURNING *', [signedFileUrl, id]);
        return result.rows[0];
    },
 

    async getByProjectId(projectId){
        const res = await db.query('SELECT * FROM project WHERE id = $1', [projectId]);
        return res.rows[0];
    },
    async getByStatus(status){
        const res = await db.query('SELECT * FROM contract WHERE status = $1', [status]);
        return res.rows;
    },
    async assignCodeIfMissing(contractId, createdAt = null) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // lock the target row to check current state
            const curRes = await client.query('SELECT id, code, code_year, code_month, code_seq, created_at FROM contract WHERE id = $1 FOR UPDATE', [contractId]);
            const cur = curRes.rows && curRes.rows[0];
            if (!cur) {
                await client.query('ROLLBACK');
                return null;
            }
            if (cur.code) {
                // already has code -> return current row
                await client.query('COMMIT');
                return cur;
            }

            // determine timestamp to use
            const ts = createdAt ? new Date(createdAt) : (cur.created_at ? new Date(cur.created_at) : new Date());
            const yy = String(ts.getFullYear()).slice(-2).padStart(2, '0');
            const mm = String(ts.getMonth() + 1).padStart(2, '0');

            // advisory lock key per year/month to avoid races: (year * 100 + month)
            const lockKey = Number(String(ts.getFullYear()) + String(ts.getMonth() + 1).padStart(2, '0'));
            // use pg_advisory_xact_lock to serialize concurrent workers for this month
            await client.query('SELECT pg_advisory_xact_lock($1)', [lockKey]);

            // compute next seq for this year/month
            const seqRes = await client.query(
                'SELECT COALESCE(MAX(code_seq), 0) AS max_seq FROM contract WHERE code_year = $1 AND code_month = $2',
                [yy, mm]
            );
            const nextSeq = Number(seqRes.rows[0].max_seq || 0) + 1;
            const seqStr = String(nextSeq).padStart(3, '0');
            const code = `SGMK-${yy}-${mm}-${seqStr}`;

            // update contract with generated code fields
            const updateRes = await client.query(
                `UPDATE contract
                 SET code = $1, code_year = $2, code_month = $3, code_seq = $4, updated_at = now()
                 WHERE id = $5
                 RETURNING *`,
                [code, yy, mm, nextSeq, contractId]
            );

            await client.query('COMMIT');
            return updateRes.rows[0];
        } catch (err) {
            try { await client.query('ROLLBACK'); } catch (_) {}
            console.error('contracts.assignCodeIfMissing error:', err && (err.stack || err.message) || err);
            throw err;
        } finally {
            client.release();
        }
    },
    async getServices(contractId) {
        const result = await db.query('SELECT * FROM contract_service WHERE contract_id = $1', [contractId]);
        return result.rows;
    },
       async update(id, fields = {}) {
        const allowed = ['status', 'total_revenue', 'start_date', 'end_date'];
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
        params.push(id);
        const sql = `UPDATE contract SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    
};
export default contracts;

