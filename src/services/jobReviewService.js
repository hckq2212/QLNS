import { jobReviewModel } from '../models/jobReviewModel.js';
import db from '../config/db.js';

export const jobReviewService = {
  getReviewForm: async (jobId, type) => {
    const jobInfo = await jobReviewModel.getJobInfo(jobId);
    if (!jobInfo) throw new Error('Không tìm thấy job');

    const criteria = await jobReviewModel.getCriteriaByJob(jobId);
    const reviewRows = await jobReviewModel.getReview(jobId, type);
    let review = null;

    if (reviewRows?.length) {
      review = {
        id: reviewRows[0].review_id,
        comment: reviewRows[0].comment,
        total_score: reviewRows[0].total_score,
        reviewed_by: reviewRows[0].reviewed_by,
        criteria: reviewRows
          .filter(r => r.criteria_id)
          .map(r => ({
            criteria_id: r.criteria_id,
            name: r.criteria_name,
            is_checked: r.is_checked,
            score: r.score,
            note: r.note
          }))
      };

      for (const c of criteria) {
        const found = review.criteria.find(rc => rc.criteria_id === c.id);
        c.is_checked = found?.is_checked || false;
        c.score = found?.score || null;
        c.note = found?.note || null;
      }
    } else {
      for (const c of criteria) {
        c.is_checked = false;
        c.score = null;
        c.note = null;
      }
    }

    return { job: jobInfo, criteria, review };
  },

  createReview: async (jobId, type, payload) => {
    const { reviewed_by, comment, criteria } = payload;
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      const criteriaList = Array.isArray(criteria) ? criteria : [];
      const totalScore = criteriaList.length
        ? criteriaList.reduce((s, c) => s + (Number(c.score) || 0), 0) / criteriaList.length
        : null;

      const review = await jobReviewModel.createReview(jobId, type, reviewed_by, comment, totalScore);
      await db.query(`DELETE FROM job_review_criteria WHERE review_id=$1`, [review.id]);
      await jobReviewModel.insertCriteria(review.id, criteriaList);

      await client.query('COMMIT');
      return { id: review.id, total_score: totalScore };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};
