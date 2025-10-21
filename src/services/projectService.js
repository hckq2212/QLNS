import projects from '../models/projects.js'
import jobsModel from '../models/jobs.js'
import db from '../config/db.js'
import partnerServiceJobs from '../models/partnerServiceJobs.js'

const projectService = {
    async list() {
        return await projects.getAll();
    },

    async getById(id) {
        if (!id) throw new Error('id required');
        const p = await projects.getById(id);
        if (!p) return null;
        p.jobs = await projects.getJobs(id);
        return p;
    },
    async getByContract (contractId) {
        const result = await projects.getByContract(contractId)
        return result
    },
    async getByStatus (status) {
        const result = await projects.getByStatus(status)
        return result
    },
    async update (id, payload) {
        const result = await projects.update(id, payload);
        return result;
    },
    async assignTeam(id, teamId){
        const result = await projects.assignTeam(id, teamId);
        return result
    },
    async createProjectForContract(contractId, name, description, startDate, creatorId) {
        const created = await projects.create({ contract_id: contractId, name, description, start_date: startDate, created_by: creatorId });
        return created;
    },
    async ackProject(projectId, userId){
        if (!projectId) throw new Error('projectId required');
        if (!userId) throw new Error('userId required');

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // set lead_ack_at and project status -> in_progress
            const upd = await client.query(
                `UPDATE project
                 SET lead_ack_at = now(),
                     status = $1,
                     updated_at = now()
                 WHERE id = $2
                 RETURNING *`,
                ['not_assigned', projectId]
            );
            const project = upd.rows[0];
            if (!project) {
                await client.query('ROLLBACK');
                throw new Error('Project not found');
            }

            // if there's no related contract, commit and return project
            const contractId = project.contract_id;
            if (!contractId) {
                await client.query('COMMIT');
                return { project, jobs: [] };
            }

            // fetch contract_service items and associated names/costs
            const csRes = await client.query(
                `SELECT cs.service_id, cs.service_job_id, cs.qty, cs.sale_price, cs.cost_price,
                        COALESCE(sj.name, s.name) AS job_name,
                        COALESCE(sj.base_cost, s.base_cost, 0) AS base_cost
                 FROM contract_service cs
                 LEFT JOIN service_job sj ON sj.id = cs.service_job_id
                 LEFT JOIN service s ON s.id = cs.service_id
                 WHERE cs.contract_id = $1`,
                [contractId]
            );
            const items = csRes.rows || [];

            const createdJobs = [];
            for (const it of items) {
                const qty = it.qty != null ? Number(it.qty) : 1;
                for (let i = 0; i < qty; i++) {
                    const jobName = it.job_name || `Job for service ${it.service_id}`;
                    const baseCost = it.base_cost != null ? it.base_cost : 0;
                    const salePrice = it.sale_price != null ? it.sale_price : 0;

                    const ins = await client.query(
                        `INSERT INTO job
                         (contract_id, project_id, service_id, service_job_id, name, base_cost, sale_price, created_by, created_at, updated_at)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now(), now())
                         RETURNING *`,
                        [contractId, projectId, it.service_id, it.service_job_id, jobName, baseCost, salePrice, userId]
                    );
                    createdJobs.push(ins.rows[0]);
                }
            }

            await client.query('COMMIT');
            return { project, jobs: createdJobs };
        } catch (err) {
            try { await client.query('ROLLBACK'); } catch (_) {}
            console.error('ackProject error:', err && (err.stack || err.message) || err);
            throw err;
        } finally {
            client.release();
        }
    },
    // assign a job inside a project (use job model assign + optional external cost override)
    async assignJob(projectId, jobId, assignedType, assignedId, externalCost = null, overrideReason = null, saveToCatalog = false) {
        if (!projectId) throw new Error('projectId required');
        if (!jobId) throw new Error('jobId required');
        if (!assignedType || (assignedType !== 'user' && assignedType !== 'partner')) throw new Error('assignedType must be "user" or "partner"');

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // lock job row
            const jobRes = await client.query('SELECT * FROM job WHERE id = $1 FOR UPDATE', [jobId]);
            const job = jobRes.rows[0];
            if (!job) {
                await client.query('ROLLBACK');
                throw new Error('job not found');
            }
            if (String(job.project_id) !== String(projectId)) {
                await client.query('ROLLBACK');
                throw new Error('job does not belong to project');
            }

            // resolve external cost validation
            let resolvedExternalCost = externalCost != null ? Number(externalCost) : null;
            if (resolvedExternalCost != null) {
                if (!Number.isFinite(resolvedExternalCost) || resolvedExternalCost < 0) {
                    await client.query('ROLLBACK');
                    throw new Error('externalCost must be a non-negative number');
                }
            }

            // partner-specific logic: check partner catalog (partner_service_job table)
            let appendOverrideNote = false;
            let catalogEntry = null;
            if (assignedType === 'partner') {
                if (!job.service_job_id) {
                    await client.query('ROLLBACK');
                    throw new Error('job is missing service_job information for partner assignment');
                }

                const pe = await client.query(
                    `SELECT COALESCE(
                        (CASE WHEN column_name IS NOT NULL THEN (SELECT external_cost FROM partner_service_job WHERE partner_id = $1 AND service_job_id = $2 LIMIT 1) END),
                        (SELECT base_cost FROM partner_service_job WHERE partner_id = $1 AND service_job_id = $2 LIMIT 1)
                    ) AS catalog_cost`,
                    [assignedId, job.service_job_id]
                ).catch(() => ({ rows: [] }));

                // fallback simpler query (handles schemas without external_cost)
                if (!pe || !pe.rows || pe.rows.length === 0) {
                    const pe2 = await client.query(
                        'SELECT base_cost, (CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=$3 AND column_name=$4) THEN (SELECT external_cost FROM partner_service_job WHERE partner_id = $1 AND service_job_id = $2 LIMIT 1) ELSE NULL END) AS external_cost FROM partner_service_job WHERE partner_id = $1 AND service_job_id = $2 LIMIT 1',
                        [assignedId, job.service_job_id, 'partner_service_job', 'external_cost']
                    ).catch(() => ({ rows: [] }));
                    if (pe2 && pe2.rows && pe2.rows[0]) {
                        catalogEntry = { catalog_cost: (pe2.rows[0].external_cost != null ? Number(pe2.rows[0].external_cost) : (pe2.rows[0].base_cost != null ? Number(pe2.rows[0].base_cost) : null)) };
                    }
                } else {
                    catalogEntry = { catalog_cost: pe.rows[0].catalog_cost != null ? Number(pe.rows[0].catalog_cost) : null };
                }

                const catalogCost = catalogEntry && catalogEntry.catalog_cost != null ? Number(catalogEntry.catalog_cost) : null;
                if (resolvedExternalCost == null) {
                    if (catalogCost == null) {
                        await client.query('ROLLBACK');
                        throw new Error('Catalog entry missing external/base cost, please provide externalCost');
                    }
                    resolvedExternalCost = catalogCost;
                } else if (catalogCost == null || Math.abs(resolvedExternalCost - catalogCost) > 0.01) {
                    appendOverrideNote = true;
                    if (!overrideReason) {
                        await client.query('ROLLBACK');
                        throw new Error('overrideReason is required when overriding catalog external cost');
                    }
                } else {
                    resolvedExternalCost = catalogCost;
                }
            }

            // assignment: write into assigned_id + assigned_type (schema uses these columns)
            await client.query(
                'UPDATE job SET assigned_id = $1, assigned_type = $2, updated_at = now() WHERE id = $3',
                [assignedId, assignedType, jobId]
            );

            // update external_cost and note if needed
            if (resolvedExternalCost != null) {
                const currentNote = job.description || job.note || '';
                let newNote = currentNote;
                if (appendOverrideNote && overrideReason) {
                    const safeReason = String(overrideReason).slice(0, 1000);
                    newNote = `${currentNote}\n[External cost override] ${safeReason}`;
                } else if (overrideReason) {
                    newNote = `${currentNote}\n[External cost note] ${String(overrideReason).slice(0,1000)}`;
                }

                await client.query(
                    'UPDATE job SET external_cost = $1, description = $2, updated_at = now() WHERE id = $3',
                    [resolvedExternalCost, newNote, jobId]
                );

                // optionally upsert catalog (use base_cost column if present)
                if (saveToCatalog) {
                    await client.query(
                        `INSERT INTO partner_service_job (partner_id, service_job_id, base_cost, created_at)
                         VALUES ($1,$2,$3, now())
                         ON CONFLICT (partner_id, service_job_id) DO UPDATE SET base_cost = EXCLUDED.base_cost, note = COALESCE(partner_service_job.note, '' )`,
                        [assignedId, job.service_job_id, resolvedExternalCost]
                    ).catch(() => {/* ignore if schema differs */});
                }
            }

            // return refreshed job
            const refreshed = await client.query('SELECT * FROM job WHERE id = $1', [jobId]);
            await client.query('COMMIT');
            return refreshed.rows[0];
        } catch (err) {
            try { await client.query('ROLLBACK'); } catch (_) {}
            console.error('assignJob error:', err && (err.stack || err.message) || err);
            throw err;
        } finally {
            client.release();
        }
    },

    async closeProject(projectId) {
        if (!projectId) throw new Error('projectId required');
        const jobs = await projects.getJobs(projectId);
        // require all jobs to be done before closing
        const notDone = jobs.find(j => j.status !== 'done');
        if (notDone) throw new Error('All jobs must be done before closing the project');

        // update project status
        const updated = await projects.update(projectId, { status: 'closed' });

        // also set contract.status = 'closed' if contract exists
        const proj = await projects.getById(projectId);
        if (proj && proj.contract_id) {
            try {
                await db.query("UPDATE contract SET status = 'closed' WHERE id = $1 AND status <> 'closed'", [proj.contract_id]);
            } catch (e) {
                // non-fatal
                console.error('Failed to update contract status when closing project', e);
            }
        }

        return updated;
    }
}

export default projectService;
