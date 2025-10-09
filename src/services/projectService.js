import projects from '../models/projects.js'
import jobsModel from '../models/jobs.js'
import db from '../config/db.js'

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

    async createProjectForContract(contractId, name, description, startDate, creatorId) {
        if (!contractId) throw new Error('contractId required');
        const created = await projects.create({ contract_id: contractId, name, description, start_date: startDate, created_by: creatorId });
        return created;
    },

    // assign a job inside a project (use job model assign + optional external cost override)
    async assignJob(projectId, jobId, assignedType, assignedId, externalCost = null, overrideReason = null) {
        if (!projectId) throw new Error('projectId required');
        if (!jobId) throw new Error('jobId required');
        if (!assignedType || (assignedType !== 'user' && assignedType !== 'partner')) throw new Error('assignedType must be "user" or "partner"');

        // ensure job belongs to project
        const job = await jobsModel.getById(jobId);
        if (!job) throw new Error('job not found');
        if (String(job.project_id) !== String(projectId)) throw new Error('job does not belong to project');

        // assign (this validates user/partner existence)
        const updatedJob = await jobsModel.assign(assignedType, assignedId, jobId);

        // if externalCost provided, update job.external_cost and append override reason to note
        if (externalCost != null) {
            // append override reason to note if provided
            let note = updatedJob.note || '';
            if (overrideReason) {
                const appended = `\n[External cost override by assign] ${overrideReason}`;
                note = note + appended;
            }
            await db.query('UPDATE job SET external_cost = $1, note = $2, updated_at = now() WHERE id = $3', [externalCost, note, jobId]);
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
