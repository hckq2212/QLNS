import projects from '../models/projects.js'
import db from '../config/db.js'
import contracts from '../models/contracts.js';
import projectReview  from '../models/projectReview.js';

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
        if(result) {
            try {
                const conId = result.contract_id;
                const status = 'assigned';
                const contract = await contracts.getById(conId);
                // ensure we check contract.status (not conId which is an integer)
                if (contract && contract.status !== 'assigned') {
                    await contracts.updateStatus(conId, status);
                }

            } catch (error) {
                console.error(error)
            }
        }
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
                `SELECT cs.service_id,
                    cs.qty,
                    cs.sale_price,
                    sjm.service_job_id,
                    COALESCE(sj.name, 'Default Job Name') AS job_name,
                    COALESCE(sj.base_cost, 0) AS base_cost,
                    COALESCE(sj.owner_type, 'user') AS owner_type
                FROM contract_service cs
                LEFT JOIN service_job_mapping sjm ON sjm.service_id = cs.service_id
                LEFT JOIN service_job sj ON sj.id = sjm.service_job_id
                LEFT JOIN service s ON s.id = cs.service_id
                WHERE cs.contract_id = $1;

                `,
                [contractId]
            );
            const items = csRes.rows || [];
            const createdJobs = [];
            for (const it of items) {
                const qty = it.qty != null ? Number(it.qty) : 1;
                const baseCost = it.base_cost != null ? it.base_cost : 0;
                const salePrice = it.sale_price != null ? it.sale_price : 0;

                for (let i = 0; i < qty; i++) {
                    const jobName = it.job_name || `Job for service ${it.service_id}`;
                    // determine assigned_type per item (fall back to 'user' if missing)
                    const assignedType = (it.owner_type && String(it.owner_type)) || 'user';
                   const ins = await client.query(
                        `INSERT INTO job
                        (contract_id, project_id, service_id, service_job_id, name, base_cost, sale_price, created_by, created_at, updated_at, status, assigned_type)
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now(), now(), $9, $10)
                        RETURNING *`,
                        [
                        contractId,
                        projectId,
                        it.service_id,
                        it.service_job_id,
                        jobName,
                        baseCost,
                        salePrice,
                        userId,
                        'not_assigned',
                        assignedType
                        ]
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
    },
    requestReview: async (projectId, userId) => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // 1. Cập nhật project sang review
      const project = await projectReview.updateProjectStatusToReview(projectId);
      if (!project) throw new Error('Không tìm thấy project');

      // 2. Lấy danh sách service trong hợp đồng
      const services = await projectReview.getContractServicesByProject(projectId);
      if (!services.length) throw new Error('Project này không có dịch vụ nào để đánh giá');

      // 3. Tạo form review cho từng dịch vụ
      for (const svc of services) {
        const review = await projectReview.createContractServiceReview(
          svc.contract_service_id,
          userId
        );
        if (review?.id) {
          await projectReview.createReviewCriteria(review.id, svc.service_id);
        }
      }

      await client.query('COMMIT');
      return { message: 'Đã chuyển project sang review và tạo form đánh giá cho các dịch vụ' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }


}


export default projectService;
