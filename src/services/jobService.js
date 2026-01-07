import jobs from "../models/jobs.js";
import db from '../config/db.js';

const jobService = {
    getAll: async () => {
        const result = await jobs.getAll();
        return result;
    },
    getById: async (jobId) => {
        const result = await jobs.getById(jobId);
        return result;
    },
    update: async(id, payload) => {
        const result = await jobs.update(id, payload);
        return result
    },
    create: async(payload) => {
        const result = await jobs.create(payload);
        return result;
    },
    getByProject: async(id) => {
        const result = await jobs.getByProject(id);
        return result;
    },

    assign: async(id, body) => {
        const result = await jobs.update(id, body);
        if(!result) throw new Error('Lỗi khi thực hiện assign job')
        return result
    },
    getMyJob: async(id) => {
        const result = await jobs.getMyJob(id);
        return result;
    },
    finish: async (jobId, newEvidence = [], userId = null) => {
  const job = await jobs.getById(jobId);
  if (!job) throw new Error('Job không tồn tại');

  const current = Array.isArray(job.evidence) ? job.evidence : [];
  const map = new Map();
  for (const it of current) if (it && it.url)
    map.set(it.url, { filename: it.filename || it.name || 'file', url: it.url });
  for (const it of newEvidence) if (it && it.url)
    map.set(it.url, { filename: it.filename || it.name || 'file', url: it.url });
  const merged = Array.from(map.values());

  const payload = {
    status: 'review', // chuyển sang trạng thái review
    evidence: merged,
    updated_by: userId,
  };

  const updated = await jobs.update(jobId, payload);
  if (!updated) throw new Error('Không thể cập nhật job');

  // ✅ Bắt đầu tạo review form
  // try {
  //   const reviewTypes = ['lead', 'sale'];

  //   for (const type of reviewTypes) {
  //     const baseReview = await jobReview.createBaseReview(jobId, type, userId);
  //     if (baseReview?.id) {
  //       await jobReview.createReviewCriteriaFromTemplate(baseReview.id, jobId);
  //     }
  //   }
  // } catch (err) {
  //   console.error('Tạo form review job thất bại:', err.message);
  //   // không throw để tránh làm fail API finish
  // }

  return updated;
},
    rework: async (jobId, newEvidence = [], userId = null) => {
  const job = await jobs.getById(jobId);
  if (!job) throw new Error('Job không tồn tại');

  // Remove any job_review rows + their criteria for this job
  try {
    await db.query(`DELETE FROM job_review_criteria WHERE review_id IN (SELECT id FROM job_review WHERE job_id = $1)`, [jobId]);
    await db.query(`DELETE FROM job_review WHERE job_id = $1`, [jobId]);
  } catch (e) {
    console.error('Failed to delete job_review for rework:', e);
    // proceed even if cleanup fails
  }

  // Replace existing evidence with newEvidence (do not merge)
  const normalized = [];
  for (const it of Array.isArray(newEvidence) ? newEvidence : []) {
    if (it && it.url) normalized.push({ filename: it.filename || it.name || 'file', url: it.url });
  }

  const payload = {
    status: 'review',
    evidence: normalized,
    updated_by: userId,
  };

  const updated = await jobs.update(jobId, payload);
  if (!updated) throw new Error('Không thể cập nhật job');

  return updated;
}

}

export default jobService