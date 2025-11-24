import  contractServiceReviewModel from '../models/contractServiceReview.js';
import db from '../config/db.js';

const contractServiceReviewService = {
  getReviewForm: async (contractServiceId) => {
    const serviceInfo = await contractServiceReviewModel.getServiceInfo(contractServiceId);
    if (!serviceInfo) throw new Error('Không tìm thấy contract_service');

    const criteria = await contractServiceReviewModel.getCriteriaByService(contractServiceId);
    const results = await contractServiceReviewModel.getResultByContractService(contractServiceId);
    const review = await contractServiceReviewModel.getExistingReview(contractServiceId);

    return {
      contract_service: serviceInfo,
      results,
      criteria,
      review
    };
  },
createReview: async (contractServiceId, { reviewed_by, reviewed_for, comment, criteria }) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 🔹 Nếu criteria không tồn tại hoặc không phải mảng, gán rỗng
    const criteriaList = Array.isArray(criteria) ? criteria : [];

    const totalScore = criteriaList.length
      ? criteriaList.reduce((s, c) => s + (Number(c.score) || 0), 0) / criteriaList.length
      : null;

    // Kiểm tra review đã tồn tại chưa
    const existing = await client.query(
      `SELECT id FROM contract_service_review WHERE contract_service_id = $1`,
      [contractServiceId]
    );
    let reviewId;

    if (existing.rows.length) {
      // Cập nhật
      const update = await client.query(
        `UPDATE contract_service_review
         SET reviewed_by=$2, reviewed_for=$3, comment=$4, total_score=$5, updated_at=now()
         WHERE contract_service_id=$1 RETURNING id`,
        [contractServiceId, reviewed_by, reviewed_for, comment, totalScore]
      );
      reviewId = update.rows[0].id;
      await client.query(`DELETE FROM contract_service_review_criteria WHERE review_id=$1`, [reviewId]);
    } else {
      // Tạo mới
      const insert = await client.query(
        `INSERT INTO contract_service_review (contract_service_id, reviewed_by, reviewed_for, comment, total_score)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [contractServiceId, reviewed_by, reviewed_for, comment, totalScore]
      );
      reviewId = insert.rows[0].id;
    }

    // Thêm chi tiết tiêu chí nếu có
    for (const c of criteriaList) {
      await client.query(
        `INSERT INTO contract_service_review_criteria (review_id, criteria_id, is_checked, score, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [reviewId, c.criteria_id, c.is_checked, c.score, c.note || null]
      );
    }

    await client.query('COMMIT');
    return { id: reviewId, total_score: totalScore };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
},

  // Lấy lại review đã có
  getReview: async (contractServiceId) => {
    const rows = await contractServiceReviewModel.getReviewByContractService(contractServiceId);
    if (!rows.length) return null;

    const review = {
      id: rows[0].review_id,
      reviewed_by: rows[0].reviewed_by,
      reviewed_for: rows[0].reviewed_for,
      comment: rows[0].comment,
      total_score: rows[0].total_score,
      criteria: rows.map(r => ({
        criteria_id: r.criteria_id,
        is_checked: r.is_checked,
        score: r.score,
        note: r.note
      }))
    };

    return review;
  }
};
export default contractServiceReviewService;
