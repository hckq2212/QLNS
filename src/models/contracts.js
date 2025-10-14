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
        return result.rows[0];
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
    },
    async getServiceUsage(contractId) {
    if (!contractId) throw new Error('contractId required');
    // detect if contract_service table exists
    const tblRes = await db.query("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contract_service') as exists");
    const hasContractService = tblRes && tblRes.rows && tblRes.rows[0] && tblRes.rows[0].exists;
    if (!hasContractService) {
    const sql = `
            SELECT
                s.id AS service_id,
                s.name AS service_name,
                COUNT(j.id) AS total_jobs,
                SUM(j.sale_price) AS total_sale_price,
                SUM(j.base_cost) AS total_cost,
            FROM job j
            JOIN service s ON s.id = j.service_id
            WHERE j.contract_id = $1
            GROUP BY s.id, s.name
            ORDER BY s.name
    `;
    const res = await db.query(sql, [contractId]);
    return res.rows;
    }

            // contract_service exists: detect column names so we don't reference missing columns
            const colsRes = await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name = 'contract_service'");
            const csCols = (colsRes.rows || []).map(r => r.column_name);

            // If contract_service already contains aggregated columns (total_jobs, total_sale_price, total_cost, avg_progress)
            // then prefer selecting those directly and merge with job aggregates as a fallback.
        const csHasTotals = csCols.includes('total_jobs') || csCols.includes('total_sale_price') || csCols.includes('total_cost') || csCols.includes('avg_progress');
        // ensure contract_service is partitioned by contract_id; otherwise we can't
        // filter by contract and should fall back to job-only aggregation.
        const hasContractIdCol = csCols.includes('contract_id') || csCols.includes('contractid') || csCols.includes('contract');
        if (csHasTotals && hasContractIdCol) {
                    const combinedSql = `
                            SELECT
                                s.id AS service_id,
                                s.name AS service_name,
                                COALESCE(cs.total_jobs, j.total_jobs, 0) AS total_jobs,
                                COALESCE(cs.total_sale_price, j.total_sale_price, 0) AS total_sale_price,
                                COALESCE(cs.total_cost, j.total_cost, 0) AS total_cost,
                                ROUND(COALESCE(cs.avg_progress, j.avg_progress, 0)::numeric, 2) AS avg_progress
                            FROM (
                                SELECT service_id FROM contract_service WHERE contract_id = $1
                                UNION
                                SELECT service_id FROM job WHERE contract_id = $1
                            ) t
                            JOIN service s ON s.id = t.service_id
                            LEFT JOIN (
                                SELECT service_id, service_name, total_jobs, total_sale_price, total_cost, avg_progress
                                FROM contract_service WHERE contract_id = $1
                            ) cs ON cs.service_id = s.id
                            LEFT JOIN (
                                SELECT service_id, COUNT(id) AS total_jobs, SUM(sale_price) AS total_sale_price, SUM(base_cost) AS total_cost, AVG(progress_percent) AS avg_progress
                                FROM job WHERE contract_id = $1 GROUP BY service_id
                            ) j ON j.service_id = s.id
                            ORDER BY s.name
                    `;
                    const cres = await db.query(combinedSql, [contractId]);
                    return cres.rows;
            }

                if (csHasTotals && !hasContractIdCol) {
                    // contract_service appears to hold pre-aggregated totals but does not
                    // include a contract_id column we can filter on. Log and fall back.
                    console.warn('contract_service contains totals but has no contract_id column; falling back to job-based aggregation');
                }

            // Fallback: no pre-aggregated totals in contract_service. Build aggregates from raw columns (previous logic)
            // helper to pick the first matching candidate
            const pick = (candidates) => {
                    for (const c of candidates) if (csCols.includes(c)) return c;
                    return null;
            };
            const svcCol = pick(['service_id', 'serviceid', 'service']);
            if (!svcCol) throw new Error('contract_service table missing service_id column');
            const qtyCol = pick(['quantity', 'qty', 'amount', 'service_quantity', 'service_qty', 'total_quantity']);
            const priceCol = pick(['sale_price', 'saleprice', 'price', 'unit_price', 'amount', 'total_sale_price']);
            const costCol = pick(['base_cost', 'basecost', 'cost', 'unit_cost', 'total_cost']);
            const progCol = pick(['progress_percent', 'progress', 'progress_pct', 'avg_progress']);

            // build cs aggregate select parts, fallback to constants when columns absent
            const csTotalQuantity = qtyCol ? `SUM(COALESCE("${qtyCol}",0)) AS total_quantity` : `0 AS total_quantity`;
            const csTotalSale = priceCol ? `SUM(COALESCE("${priceCol}",0)) AS total_sale_price` : `0 AS total_sale_price`;
            const csTotalCost = costCol ? `SUM(COALESCE("${costCol}",0)) AS total_cost` : `0 AS total_cost`;
            const csAvgProg = progCol ? `AVG("${progCol}") AS avg_progress` : `NULL::numeric AS avg_progress`;

            const combinedSql = `
                    SELECT
                        s.id AS service_id,
                        s.name AS service_name,
                        COALESCE(cs.total_quantity, 0) AS total_quantity,
                        COALESCE(j.total_jobs, 0) AS total_jobs,
                        COALESCE(j.total_sale_price,0) + COALESCE(cs.total_sale_price,0) AS total_sale_price,
                        COALESCE(j.total_cost,0) + COALESCE(cs.total_cost,0) AS total_cost,
                        ROUND(COALESCE(j.avg_progress, cs.avg_progress, 0)::numeric, 2) AS avg_progress
                    FROM (
                        SELECT "${svcCol}" AS service_id FROM contract_service WHERE contract_id = $1
                        UNION
                        SELECT service_id FROM job WHERE contract_id = $1
                    ) t
                    JOIN service s ON s.id = t.service_id
                    LEFT JOIN (
                        SELECT "${svcCol}" AS service_id, ${csTotalQuantity}, ${csTotalSale}, ${csTotalCost}, ${csAvgProg}
                        FROM contract_service WHERE contract_id = $1 GROUP BY "${svcCol}"
                    ) cs ON cs.service_id = s.id
                    LEFT JOIN (
                        SELECT service_id, COUNT(id) AS total_jobs, SUM(sale_price) AS total_sale_price, SUM(base_cost) AS total_cost, AVG(progress_percent) AS avg_progress
                        FROM job WHERE contract_id = $1 GROUP BY service_id
                    ) j ON j.service_id = s.id
                    ORDER BY s.name
            `;
            const cres = await db.query(combinedSql, [contractId]);
            return cres.rows;
        },

    // Ensure a contract has a code assigned. If already assigned, return the row unchanged.
                    // This helper acquires a per-year-month advisory lock and sets code/code_year/code_month/code_seq
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
                    ,
                    // Upsert an array of aggregates into contract_service table in a schema-resilient way.
                    // aggregates: [{ contract_id, service_id, service_name, total_jobs, total_sale_price, total_cost, avg_progress, qty, quantity }]
                    async upsertContractServicesFromAggregates(aggregates = []) {
                        if (!Array.isArray(aggregates) || aggregates.length === 0) return 0;
                        const client = await db.connect();
                        try {
                            await client.query('BEGIN');
                            // ensure contract_service table exists
                            const tblRes = await client.query("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contract_service') as exists");
                            if (!tblRes.rows || !tblRes.rows[0] || !tblRes.rows[0].exists) {
                                await client.query('ROLLBACK');
                                throw new Error('contract_service table does not exist');
                            }
                            const colsRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name = 'contract_service'");
                            const csCols = (colsRes.rows || []).map(r => r.column_name);

                            let affected = 0;
                            for (const a of aggregates) {
                                const contractId = a.contract_id;
                                const svcId = a.service_id;
                                if (!contractId || !svcId) continue;

                                const writeCols = [];
                                const writeVals = [];
                                // always include contract_id, service_id
                                writeCols.push('contract_id'); writeVals.push(contractId);
                                writeCols.push('service_id'); writeVals.push(svcId);

                                if (csCols.includes('service_name') && a.service_name != null) { writeCols.push('service_name'); writeVals.push(a.service_name); }
                                if (csCols.includes('total_jobs') && a.total_jobs != null) { writeCols.push('total_jobs'); writeVals.push(a.total_jobs); }
                                if (csCols.includes('qty') && a.qty != null) { writeCols.push('qty'); writeVals.push(a.qty); }
                                if (csCols.includes('quantity') && a.quantity != null) { writeCols.push('quantity'); writeVals.push(a.quantity); }
                                if (csCols.includes('total_sale_price') && a.total_sale_price != null) { writeCols.push('total_sale_price'); writeVals.push(a.total_sale_price); }
                                if (csCols.includes('total_cost') && a.total_cost != null) { writeCols.push('total_cost'); writeVals.push(a.total_cost); }
                                if (csCols.includes('avg_progress') && a.avg_progress != null) { writeCols.push('avg_progress'); writeVals.push(a.avg_progress); }

                                // check exists
                                const existsRes = await client.query('SELECT 1 FROM contract_service WHERE contract_id = $1 AND service_id = $2 LIMIT 1', [contractId, svcId]);
                                if (existsRes.rows && existsRes.rows.length > 0) {
                                    // build update
                                    const sets = [];
                                    const params = [];
                                    let idx = 1;
                                    for (let i = 0; i < writeCols.length; i++) {
                                        const col = writeCols[i]; const val = writeVals[i];
                                        if (col === 'contract_id' || col === 'service_id') continue;
                                        sets.push(`${col} = $${idx}`); params.push(val); idx++;
                                    }
                                    if (sets.length > 0) {
                                        params.push(contractId); params.push(svcId);
                                        const sql = `UPDATE contract_service SET ${sets.join(', ')}, updated_at = now() WHERE contract_id = $${idx} AND service_id = $${idx+1}`;
                                        await client.query(sql, params);
                                        affected++;
                                    }
                                } else {
                                    const placeholders = writeCols.map((_, i) => `$${i+1}`);
                                    const sql = `INSERT INTO contract_service (${writeCols.join(', ')}, created_at) VALUES (${placeholders.join(', ')}, now())`;
                                    await client.query(sql, writeVals);
                                    affected++;
                                }
                            }
                            await client.query('COMMIT');
                            return affected;
                        } catch (err) {
                            try { await client.query('ROLLBACK'); } catch(e) {}
                            throw err;
                        } finally {
                            client.release();
                        }
                    }
};
export default contracts;

