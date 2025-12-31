import { jobReview } from '../models/jobReview.js';
import db from '../config/db.js';

export const jobReviewService = {
  getReviewForm: async (jobId, type) => {
    const jobInfo = await jobReview.getJobInfo(jobId);
    if (!jobInfo) throw new Error('Không tìm thấy job');

    const criteria = await jobReview.getCriteriaByJob(jobId);
    const reviewRows = await jobReview.getReview(jobId, type);
    let review = null;

    if (reviewRows?.length) {
      review = {
        id: reviewRows[0].review_id,
        comment: reviewRows[0].comment,
        reviewed_by: reviewRows[0].reviewed_by,
        criteria: reviewRows
          .filter(r => r.criteria_id)
          .map(r => ({
            criteria_id: r.criteria_id,
            name: r.criteria_name,
            is_checked: r.is_checked,
            note: r.note
          }))
      };

      for (const c of criteria) {
        const found = review.criteria.find(rc => rc.criteria_id === c.id);
        c.is_checked = found?.is_checked || false;
        c.note = found?.note || null;
      }
    } else {
      for (const c of criteria) {
        c.is_checked = false;
        c.note = null;
      }
    }

    return { job: jobInfo, criteria, review };
  },

  createReview: async (jobId, reviewed_by, type, payload) => {
  const { comment, review, is_passed } = payload;
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const criteriaList = Array.isArray(review) ? review : [];

    // 🔹 Kiểm tra tất cả tiêu chí đạt (is_checked = true)
    // const isPassed =
    //   criteriaList.length > 0 &&
    //   criteriaList.every(c => c.is_checked === true || c.is_checked === 'true');

    // 🔹 Lưu review chính (không cần total_score)
    const reviewRecord = await jobReview.createReview(
      jobId,
      type,
      reviewed_by,
      comment,
      is_passed
    );

    // 🔹 Làm mới chi tiết tiêu chí
    await db.query(`DELETE FROM job_review_criteria WHERE review_id=$1`, [reviewRecord.id]);
    await jobReview.insertCriteria(reviewRecord.id, criteriaList);

    await client.query('COMMIT');
    return { id: reviewRecord.id, is_passed:  reviewRecord.is_passed};
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
};
