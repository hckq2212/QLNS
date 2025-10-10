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
        // if trying to change proposal_file_url, ensure contract is not already approved
        if (Object.prototype.hasOwnProperty.call(fields, 'proposal_file_url')) {
            const cur = await db.query('SELECT status FROM contract WHERE id = $1', [id]);
            if (cur.rows && cur.rows.length > 0) {
                if (cur.rows[0].status === 'approved') throw new Error('proposal_file_url cannot be changed after approval');
            }
        }
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
    async updateStatus(id, status, actorId = null, nowDate = null) {
        if (!id) throw new Error('id required');
        // Use a client to allow transactional operations for code generation and debt checks
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // If moving to waiting_hr_confirm, assign code SGMK-YY-MM-XXX uniquely per month
            if (status === 'waiting_hr_confirm') {
                // Use contract.created_at (if present) as the partitioning date; otherwise use nowDate or current time.
                const createdRes = await client.query('SELECT created_at FROM contract WHERE id = $1 FOR UPDATE', [id]);
                let partDate = null;
                if (createdRes.rows && createdRes.rows.length > 0 && createdRes.rows[0].created_at) {
                    partDate = new Date(createdRes.rows[0].created_at);
                } else if (nowDate) {
                    partDate = new Date(nowDate);
                } else {
                    partDate = new Date();
                }
                // use UTC to avoid local timezone shifts
                const yy = String(partDate.getUTCFullYear()).slice(-2);
                const mm = String(partDate.getUTCMonth() + 1).padStart(2, '0');

                // lock rows for this month by selecting max seq FOR UPDATE (DB will lock)
                const seqRes = await client.query('SELECT COALESCE(MAX(code_seq),0) as maxseq FROM contract WHERE code_year = $1 AND code_month = $2 FOR UPDATE', [yy, mm]);
                const nextSeq = Number(seqRes.rows[0].maxseq || 0) + 1;
                const seqStr = String(nextSeq).padStart(3, '0');
                const code = `SGMK-${yy}-${mm}-${seqStr}`;

                const upd = await client.query('UPDATE contract SET code = $1, code_year = $2, code_month = $3, code_seq = $4, status = $5, updated_at = now() WHERE id = $6 RETURNING *', [code, yy, mm, nextSeq, status, id]);
                await client.query('COMMIT');
                return upd.rows[0];
            }

            // If moving to approved, enforce debt total == total_revenue
            if (status === 'approved') {
                // get contract revenue
                const cRes = await client.query('SELECT total_revenue FROM contract WHERE id = $1 FOR UPDATE', [id]);
                if (!cRes.rows || cRes.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return null;
                }
                const totalRevenue = Number(cRes.rows[0].total_revenue || 0);
                const dRes = await client.query('SELECT COALESCE(SUM(amount),0) as s FROM debt WHERE contract_id = $1', [id]);
                const debtSum = Number(dRes.rows[0].s || 0);
                if (Math.abs(debtSum - totalRevenue) > 0.01) {
                    await client.query('ROLLBACK');
                    throw new Error('Debt total does not match contract total_revenue');
                }
                const upd = await client.query('UPDATE contract SET status = $1, approved_by = COALESCE($2, approved_by), updated_at = now() WHERE id = $3 RETURNING *', [status, actorId, id]);
                await client.query('COMMIT');
                return upd.rows[0];
            }

            // Default: simple status update
            const result = await client.query('UPDATE contract SET status = $1, approved_by = COALESCE($2, approved_by), updated_at = now() WHERE id = $3 RETURNING *', [status, actorId, id]);
            await client.query('COMMIT');
            return result.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
    ,
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

    ,
    async updateProjectAck(projectId, userId) {
        if (!projectId) throw new Error('projectId required');
        const result = await db.query('UPDATE project SET lead_ack_at = now(), lead_ack_by = $1 WHERE id = $2 RETURNING *', [userId, projectId]);
        const updated = result.rows[0];
        return updated;
    }

    ,async getByProjectId(projectId){
        const res = await db.query('SELECT * FROM project WHERE id = $1', [projectId]);
        return res.rows[0];
    }
}
export default contracts;

