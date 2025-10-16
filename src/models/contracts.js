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
    async create(opportunity_id, customer_id, total_cost, total_revenue, created_by) {
        const result = db.query(
            `INSERT INTO contract(
             opportunity_id, customer_id, total_cost, total_revenue, status, created_by
             )VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *
            `,
            [opportunity_id, customer_id, total_cost, total_revenue,  "waiting_hr_confirm", created_by]
        
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
    }
    
};
export default contracts;

