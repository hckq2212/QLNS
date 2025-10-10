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
        const result = await db.query("SELECT * FROM contract WHERE status = 'pending'")
        return result.rows;
    },
    async create (opportunityId, customerId, totalCost, creatorId) {
        const result = await db.query(
            "INSERT INTO contract (opportunity_id, customer_id, total_cost, created_by, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING *",
            [opportunityId, customerId, totalCost, creatorId]
        );
        return result.rows[0];
    }
    ,
    async update(id, fields = {}) {
        if (!id) throw new Error('id required');
        const allowed = ['proposal_file_url', 'status', 'approved_by', 'signed_file_url', 'legal_confirmed_at', 'deployed_at', 'total_cost', 'total_revenue'];
        const set = [];
        const params = [];
        let idx = 1;
        for (const key of Object.keys(fields)) {
            if (allowed.includes(key)) {
                set.push(`${key} = $${idx}`);
                params.push(fields[key]);
                idx++;
            }
        }
        if (set.length === 0) return null;
        params.push(id);
        const sql = `UPDATE contract SET ${set.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`;
        const result = await db.query(sql, params);
        return result.rows[0];
    }
    ,
    async updateStatus(id, status, actorId = null) {
        if (!id) throw new Error('id required');
        const result = await db.query('UPDATE contract SET status = $1, approved_by = COALESCE($2, approved_by), updated_at = now() WHERE id = $3 RETURNING *', [status, actorId, id]);
        return result.rows[0];
    }
    ,
    async signContract(id, signedFileUrl) {
        if (!id) throw new Error('id required');
        const result = await db.query('UPDATE contract SET signed_file_url = $1, legal_confirmed_at = now(), updated_at = now() WHERE id = $2 RETURNING *', [signedFileUrl, id]);
        return result.rows[0];
    }
    ,
    async deployContract(id) {
        if (!id) throw new Error('id required');
        // set status to deployed and deployed_at
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            const res = await client.query('UPDATE contract SET status = $1, deployed_at = now(), updated_at = now() WHERE id = $2 RETURNING *', ['deployed', id]);
            const contract = res.rows[0];
            if (!contract) { await client.query('ROLLBACK'); return null; }
            // update project.status if any project exists for this contract
            await client.query("UPDATE project SET status = COALESCE(status,'ready') WHERE contract_id = $1", [id]);
            await client.query('COMMIT');
            return contract;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}
export default contracts;
