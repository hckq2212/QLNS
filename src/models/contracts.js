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
            `INSERT INTO contract (proposal_file_url)
            VALUES ($1)
            WHERE id = $2`,
            [url, id]
        )
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
    async updateStatus (status, approverId, id) {
        const result = await db.query(
            `UPDATE table_name
            SET status = $1, approved_by = $2
            WHERE contract_id = $3;
            RETURNING *`,
            [status,approverId,id])
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
        if (!contractId) throw new Error('contractId required');
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            const sel = await client.query('SELECT id, created_at, code_seq FROM contract WHERE id = $1 FOR UPDATE', [contractId]);
            if (!sel.rows || sel.rows.length === 0) {
                await client.query('ROLLBACK');
                throw new Error('contract not found');
            }
            const row = sel.rows[0];
            if (row.code_seq != null) {
                const refreshed = await client.query('SELECT * FROM contract WHERE id = $1', [contractId]);
                await client.query('COMMIT');
                return refreshed.rows[0];
            }

            const partDate = row.created_at ? new Date(row.created_at) : (createdAt ? new Date(createdAt) : new Date());
            const yy = String(partDate.getUTCFullYear()).slice(-2);
            const mm = String(partDate.getUTCMonth() + 1).padStart(2, '0');

            // advisory lock scoped to transaction
            await client.query('SELECT pg_advisory_xact_lock(($1::int * 100) + $2::int)', [Number(yy), Number(mm)]);
            const seqRes = await client.query('SELECT COALESCE(MAX(code_seq),0) AS maxseq FROM contract WHERE code_year = $1 AND code_month = $2', [yy, mm]);
            const maxseq = seqRes && seqRes.rows && seqRes.rows[0] ? Number(seqRes.rows[0].maxseq || 0) : 0;
            const nextSeq = maxseq + 1;
            const seqStr = String(nextSeq).padStart(3, '0');
            const code = `SGMK-${yy}-${mm}-${seqStr}`;

            const upd = await client.query('UPDATE contract SET code = $1, code_year = $2, code_month = $3, code_seq = $4, updated_at = now() WHERE id = $5 RETURNING *', [code, yy, mm, nextSeq, contractId]);
            await client.query('COMMIT');
            return upd.rows[0];
        } catch (err) {
            try { await client.query('ROLLBACK'); } catch(e) {}
            throw err;
        } finally {
            client.release();
        }
    }
    
};
export default contracts;

