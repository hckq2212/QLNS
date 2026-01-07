import { acceptance } from '../models/acceptance.js';
import db from '../config/db.js';
import contractServices from '../models/contractServices.js';
// import nodemailer from 'nodemailer';

export const acceptanceService = {
  createDraft: async (payload, created_by) => {
 if (!payload || typeof payload !== 'object') {
    throw new Error('Payload không hợp lệ');
  }

  const { project_id, comment = null, job_ids } = payload;

  if (!project_id) throw new Error('Thiếu project_id');

  // 🔹 Xử lý job_ids hoặc jobs array
  let jobIds = [];

  if (Array.isArray(job_ids) && job_ids.length > 0) {
    // Trường hợp gửi job_ids: [42, 43]
    jobIds = [...new Set(job_ids.map(Number).filter(n => Number.isInteger(n)))];
  } else if (Array.isArray(payload.jobs) && payload.jobs.length > 0) {
    // Trường hợp gửi jobs: [{job_id: 42}, {id: 43}]
    jobIds = [...new Set(
      payload.jobs
        .map(j => Number(j?.job_id ?? j?.id))
        .filter(n => Number.isInteger(n))
    )];
  } else if (Array.isArray(payload.result) && payload.result.length > 0) {
    // Fallback cho result
    jobIds = [...new Set(
      payload.result
        .map(j => Number(j?.job_id ?? j?.id))
        .filter(n => Number.isInteger(n))
    )];
  }

  if (!jobIds.length) throw new Error('Thiếu job_ids hoặc jobs (phải là mảng có phần tử hợp lệ)');

  const { rows: jobData } = await db.query(`
    SELECT 
      j.id AS job_id,
      j.name AS job_name,
      j.evidence,
      s.code AS service_code,
      s.id AS service_id
    FROM job j
    JOIN service s ON s.id = j.service_id
    WHERE j.id = ANY($1::int[])
    ORDER BY array_position($1::int[], j.id)
  `, [jobIds]);

  const { rows: nameRows } = await db.query(`
  SELECT
    (elem->>'job_id')::int AS job_id,
    elem->>'name' AS name
  FROM contract_service cs
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(cs.result, '[]'::jsonb)) elem
  WHERE (elem->>'job_id')::int = ANY($1::int[])
`, [jobIds]);

const nameMap = new Map(nameRows.map(r => [r.job_id, r.name]));


  if (!jobData.length) throw new Error('Không tìm thấy job hợp lệ');

const cleanJobs = jobData.map((j, idx) => {
  const existingName = nameMap.get(j.job_id);

  return {
    job_id: j.job_id,
    // ✅ giữ name từ contract_service nếu có
    name: existingName ?? `${j.service_code}-${String(idx + 1).padStart(3, '0')}`,
    evidence: j.evidence || [],
    service_id: j.service_id,
  };
});

const initResult = cleanJobs.map(j => ({
  job_id: j.job_id,
  name: j.name,
  evidence: j.evidence,
  status: 'submitted',
}));


  return await acceptance.createDraft({
    project_id,
    created_by,
    comment,
    jobs: cleanJobs,
    result: initResult
  });
  },

  submitToBOD: async (id) => {
    const record = await acceptance.getById(id);
    if (!record) throw new Error('Không tìm thấy phiếu nghiệm thu');
    if (record.status !== 'draft')
      throw new Error('Chỉ có thể gửi BOD khi trạng thái là draft');
    return await acceptance.updateStatus(id, 'submitted_bod');
  },

approveByBOD: async (id, jobId, userId) => {
  const record = await acceptance.getById(id);
  if (!record) throw new Error('Không tìm thấy phiếu nghiệm thu');

  const resultArrCurrent = record.result || [];

  // Nếu không truyền jobId => duyệt toàn bộ biên bản (approve all)
  if (!jobId) {
    // Update all jobs to accepted
    const jobIds = (record.jobs || [])
      .map(j => Number(j?.job_id ?? j?.id))
      .filter(n => Number.isInteger(n));

    if (jobIds.length) {
      await db.query(
        `UPDATE job SET status = 'done' WHERE id = ANY($1::int[])`,
        [jobIds]
      );

      // Update corresponding contract_service.result entries for each jobId
      for (const jId of jobIds) {
        const csRows = await db.query(
          `SELECT id, COALESCE(result, '[]'::jsonb) AS result
           FROM contract_service
           WHERE EXISTS (
             SELECT 1 FROM jsonb_array_elements(COALESCE(result, '[]'::jsonb)) elem
             WHERE (elem->>'job_id')::int = $1
           )`,
          [jId]
        );
        for (const cs of csRows.rows) {
          const arr = Array.isArray(cs.result) ? cs.result : [];
          const updated = arr.map(item => {
            if (Number(item?.job_id) === Number(jId)) {
              return { ...item, status: 'approved' };
            }
            return item;
          });
          await contractServices.update(cs.id, { result: updated });
        }
      }
    }
    // proceed to set acceptance status to approved
    const updated = await acceptance.updateStatus(id, 'approved', userId);
    return updated;
  }

  // Partial / single job approval flow
  const exists = resultArrCurrent.some(r => Number(r?.job_id) === Number(jobId));
  if (!exists) throw new Error('job_id không nằm trong phiếu nghiệm thu');

  const afterResult = await acceptance.updateResultStatusByJobId(id, jobId, 'approved');

  // Update the job row
  await db.query(`UPDATE job SET status = 'done' WHERE id = $1`, [Number(jobId)]);

  // Update any contract_service records referencing this job (service_job_id)
  const csRows = await db.query(
    `SELECT id, COALESCE(result, '[]'::jsonb) AS result
     FROM contract_service
     WHERE EXISTS (
       SELECT 1 FROM jsonb_array_elements(COALESCE(result, '[]'::jsonb)) elem
       WHERE (elem->>'job_id')::int = $1
     )`,
    [Number(jobId)]
  );
  for (const cs of csRows.rows) {
    const arr = Array.isArray(cs.result) ? cs.result : [];
    const updated = arr.map(item => {
      if (Number(item?.job_id) === Number(jobId)) {
        return { ...item, status: 'approved' };
      }
      return item;
    });
    await contractServices.update(cs.id, { result: updated });
  }

  // Recompute overall acceptance status
  const resultArr = afterResult?.result || [];
  const allAccepted = resultArr.length > 0 && resultArr.every(x => x.status === 'approved' );
  const nextAcceptanceStatus = allAccepted ? 'approved' : 'partial_approved';

  const updated = await acceptance.updateStatus(id, nextAcceptanceStatus, allAccepted ? userId : null);
  return updated;
},


  rejectByBOD: async (id, jobId, userId) => {  
      const record = await acceptance.getById(id);
      if (!record) throw new Error('Không tìm thấy phiếu nghiệm thu');

      const resultArrCurrent = record.result || [];

      // Nếu không truyền jobId => đánh dấu tất cả jobs need_rework và set job.status = 'rework'
      if (!jobId) {
        const jobIds = (record.jobs || [])
          .map(j => Number(j?.job_id ?? j?.id))
          .filter(n => Number.isInteger(n));

        if (jobIds.length) {
          await db.query(
            `UPDATE job SET status = 'rework' WHERE id = ANY($1::int[])`,
            [jobIds]
          );

          // Update corresponding contract_service.result entries for each jobId
          const csRows = await db.query(
            `SELECT id, COALESCE(result, '[]'::jsonb) AS result
             FROM contract_service
             WHERE EXISTS (
               SELECT 1 FROM jsonb_array_elements(COALESCE(result, '[]'::jsonb)) elem
               WHERE (elem->>'job_id')::int = ANY($1::int[])
             )`,
            [jobIds]
          );
          for (const cs of csRows.rows) {
            const arr = Array.isArray(cs.result) ? cs.result : [];
            const updated = arr.map(item => {
              if (jobIds.includes(Number(item?.job_id))) {
                return { ...item, status: 'need_rework' };
              }
              return item;
            });
            await contractServices.update(cs.id, { result: updated });
          }
        }

        // update acceptance result statuses to need_rework (direct DB update)
        const newResult = resultArrCurrent.map(r => ({ ...r, status: 'need_rework' }));
        await db.query(
          `UPDATE acceptance SET result = $2::jsonb WHERE id = $1 RETURNING *`,
          [id, JSON.stringify(newResult)]
        );

        const updated = await acceptance.updateStatus(id, 'rejected', userId);
        return updated;
      }

      // Partial / single job rejection flow: set that job's result status to need_rework
      const exists = resultArrCurrent.some(r => Number(r?.job_id) === Number(jobId));
      if (!exists) throw new Error('job_id không nằm trong phiếu nghiệm thu');

      const afterResult = await acceptance.updateResultStatusByJobId(id, jobId, 'need_rework');

      // Update the job row to rework
      await db.query(`UPDATE job SET status = 'rework' WHERE id = $1`, [Number(jobId)]);

      // Update any contract_service records referencing this job
      const csRows = await db.query(
        `SELECT id, COALESCE(result, '[]'::jsonb) AS result
         FROM contract_service
         WHERE EXISTS (
           SELECT 1 FROM jsonb_array_elements(COALESCE(result, '[]'::jsonb)) elem
           WHERE (elem->>'job_id')::int = $1
         )`,
        [Number(jobId)]
      );
      for (const cs of csRows.rows) {
        const arr = Array.isArray(cs.result) ? cs.result : [];
        const updated = arr.map(item => {
          if (Number(item?.job_id) === Number(jobId)) {
            return { ...item, status: 'need_rework' };
          }
          return item;
        });
        await contractServices.update(cs.id, { result: updated });
      }

      // Recompute overall acceptance status
      const resultArr = afterResult?.result || [];
      const allNeedRework = resultArr.length > 0 && resultArr.every(x => x.status === 'need_rework');
      const nextAcceptanceStatus = allNeedRework ? 'rejected' : 'partial_rejected';

      const updated = await acceptance.updateStatus(id, nextAcceptanceStatus, allNeedRework ? userId : null);
      return updated;
    },
 getByProject : async (projectId) => {
  if (!projectId) throw new Error('Thiếu project_id');
  return await acceptance.getByProject(projectId);
},
 getById : async (id) => {
  if (!id) throw new Error('Thiếu ID biên bản nghiệm thu');
  return await acceptance.getById(id);
 }
}
