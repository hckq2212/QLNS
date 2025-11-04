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
                         (contract_id, project_id, service_id, service_job_id, name, base_cost, sale_price, created_by, created_at, updated_at, status)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now(), now(), 'not_assigned')
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
