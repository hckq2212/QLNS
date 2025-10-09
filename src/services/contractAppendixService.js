import contractAppendix from '../models/contractAppendix.js'
import db from '../config/db.js'

const contractAppendixService = {
    async createAppendix(payload) {
        // payload should include contract_id, job_id (optional), proposer_id, description, cost_change, sale_price_change
        if (!payload || !payload.contract_id) throw new Error('contract_id required');
        const created = await contractAppendix.create(payload);
        return created;
    },

    async approveAppendix(id, approverId) {
        if (!id || !approverId) throw new Error('id and approverId required');
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            const approved = await contractAppendix.approve(id, approverId);
            if (!approved) {
                await client.query('ROLLBACK');
                throw new Error('Appendix not found or not pending');
            }

            // apply changes to job if job_id provided
            if (approved.job_id) {
                // update job external_cost and/or sale_price based on appendix
                const updates = [];
                const params = [];
                let idx = 1;
                if (approved.cost_change != null) {
                    updates.push(`external_cost = COALESCE(external_cost, 0) + $${idx}`);
                    params.push(Number(approved.cost_change));
                    idx++;
                }
                if (approved.sale_price_change != null) {
                    updates.push(`sale_price = COALESCE(sale_price, 0) + $${idx}`);
                    params.push(Number(approved.sale_price_change));
                    idx++;
                }
                if (updates.length > 0) {
                    params.push(approved.job_id);
                    const sql = `UPDATE job SET ${updates.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`;
                    await client.query(sql, params);
                }
            } else {
                // if appendix targets whole contract, optionally adjust jobs or contract-level numbers
                if (approved.cost_change != null || approved.sale_price_change != null) {
                    // simple policy: add cost_change to contract.total_cost and sale_price_change to contract.total_revenue
                    await client.query('UPDATE contract SET total_cost = COALESCE(total_cost,0) + $1, total_revenue = COALESCE(total_revenue,0) + $2 WHERE id = $3', [approved.cost_change || 0, approved.sale_price_change || 0, approved.contract_id]);
                }
            }

            // DB trigger trg_job_sync_contract will recalc totals if we changed job rows; if we updated contract directly above, that's enough.

            await client.query('COMMIT');
            return approved;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    async getById(id) {
        return await contractAppendix.getById(id);
    },

    async listByContract(contractId) {
        return await contractAppendix.listByContract(contractId);
    }
}

export default contractAppendixService;
