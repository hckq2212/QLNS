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
                ['in_progress', projectId]
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

        // ensure job belongs to project
        const job = await jobsModel.getById(jobId);
        if (!job) throw new Error('job not found');
        if (String(job.project_id) !== String(projectId)) throw new Error('job does not belong to project');

        const saveCatalogFlag = Boolean(saveToCatalog);

        let resolvedExternalCost = externalCost != null ? Number(externalCost) : null;
        if (resolvedExternalCost != null) {
            if (!Number.isFinite(resolvedExternalCost)) {
                throw new Error('externalCost must be a valid number');
            }
            if (resolvedExternalCost < 0) {
                throw new Error('externalCost must be a non-negative number');
            }
        }

        let appendOverrideNote = false;
        let catalogEntry = null;

        if (assignedType === 'partner') {
            if (!job.service_job_id) {
                throw new Error('job is missing service_job information for partner assignment');
            }

            catalogEntry = await partnerServiceJobs.findByPartnerAndJob(assignedId, job.service_job_id);

            if (catalogEntry) {
                const catalogCost = catalogEntry.external_cost != null ? Number(catalogEntry.external_cost) : null;
                if (resolvedExternalCost == null) {
                    if (catalogCost == null) {
                        throw new Error('Catalog entry missing external cost, please provide externalCost');
                    }
                    resolvedExternalCost = catalogCost;
                } else if (catalogCost == null || Math.abs(resolvedExternalCost - catalogCost) > 0.01) {
                    appendOverrideNote = true;
                    if (!overrideReason) {
                        throw new Error('overrideReason is required when overriding catalog external cost');
                    }
                } else {
                    resolvedExternalCost = catalogCost;
                }
            } else {
                if (resolvedExternalCost == null) {
                    throw new Error('externalCost is required when partner has no catalog entry');
                }
                appendOverrideNote = true;
                if (!overrideReason) {
                    throw new Error('overrideReason is required when assigning partner without catalog');
                }
            }
        }
        // assign (this validates user/partner existence)
        const updatedJob = await jobsModel.assign(assignedType, assignedId, jobId);

        // if externalCost provided, update job.external_cost and append override reason to note
       if (assignedType === 'partner') {
            if (resolvedExternalCost != null) {
                let note = updatedJob.note || '';
                if (appendOverrideNote && overrideReason) {
                    const appended = `\n[External cost override by assign] ${overrideReason}`;
                    note = note + appended;
                }
                await db.query('UPDATE job SET external_cost = $1, note = $2, updated_at = now() WHERE id = $3', [resolvedExternalCost, note, jobId]);

                if ((!catalogEntry || appendOverrideNote) && saveCatalogFlag) {
                    await partnerServiceJobs.upsert(assignedId, job.service_job_id, resolvedExternalCost);
                }
            }
            const refreshed = await jobsModel.getById(jobId);
            return refreshed;
        }
        if (resolvedExternalCost != null) {
            let note = updatedJob.note || '';
            if (overrideReason) {
                const appended = `\n[External cost override by assign] ${overrideReason}`;
                note = note + appended;
            }
           await db.query('UPDATE job SET external_cost = $1, note = $2, updated_at = now() WHERE id = $3', [resolvedExternalCost, note, jobId]);
            const refreshed = await jobsModel.getById(jobId);
            return refreshed;
        }

        return updatedJob;
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
