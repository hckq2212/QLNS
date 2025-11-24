import  contractServiceReviewModel from '../models/contractServiceReview.js';
import db from '../config/db.js';

const contractServiceReviewService = {
  getReviewForm: async (contractServiceId) => {
  // 1️⃣ Lấy thông tin dịch vụ
  const serviceInfo = await contractServiceReviewModel.getServiceInfo(contractServiceId);
  if (!serviceInfo) throw new Error('Không tìm thấy contract_service');

  // 2️⃣ Lấy tiêu chí gốc
  const criteria = await contractServiceReviewModel.getCriteriaByService(contractServiceId);

  // 3️⃣ Lấy kết quả (result) từ contract_service
  const results = await contractServiceReviewModel.getResultByContractService(contractServiceId);

  // 4️⃣ Lấy dữ liệu review nếu có
  const reviewRows = await contractServiceReviewModel.getExistingReview(contractServiceId);
  let review = null;

  if (reviewRows?.length) {
    // Có review tổng thể
    review = {
      id: reviewRows[0].review_id,
      comment: reviewRows[0].comment,
      reviewed_by: reviewRows[0].reviewed_by,
      reviewed_for: reviewRows[0].reviewed_for,
      reviewer_name: reviewRows[0].reviewer_name || null,
      criteria: reviewRows
        .filter(r => r.criteria_id) // chỉ lấy các dòng có tiêu chí
        .map(r => ({
          criteria_id: r.criteria_id,
          is_checked: r.is_checked,
          score: r.score,
          note: r.note
        }))
    };

    // ✅ Nếu review chưa có dòng tiêu chí → khởi tạo mặc định từ service_criteria
    if (!review.criteria.length) {
      const baseCriteria = await contractServiceReviewModel.getCriteriaByService(contractServiceId);
      review.criteria = baseCriteria.map(c => ({
        criteria_id: c.id,
        name: c.name,
        description: c.description,
        is_checked: false,
        score: null,
        note: null
      }));
    }

    // ✅ Merge dữ liệu review vào criteria gốc để hiển thị tick và điểm
    for (const c of criteria) {
      const found = review.criteria.find(rc => rc.criteria_id === c.id);
      c.is_checked = found?.is_checked || false;
      c.score = found?.score || null;
      c.note = found?.note || null;
    }
  } else {
    // Chưa có review nào → thêm cờ mặc định
    for (const c of criteria) {
      c.is_checked = false;
      c.score = null;
      c.note = null;
    }
  }

  // ✅ Trả dữ liệu về cho FE
  return {
    contract_service: serviceInfo,
    results,
    criteria,
    review
  };
},

createReview: async (contractServiceId, { reviewed_by, reviewed_for, comment, criteria, review }) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 🔹 Nhận cả 2 trường hợp: criteria[] hoặc review[]
    const criteriaList = Array.isArray(criteria) ? criteria : (Array.isArray(review) ? review : []);


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
         SET reviewed_by=$2, reviewed_for=$3, comment=$4, updated_at=now()
         WHERE contract_service_id=$1 RETURNING id`,
        [contractServiceId, reviewed_by, reviewed_for, comment]
      );
      reviewId = update.rows[0].id;
      await client.query(`DELETE FROM contract_service_review_criteria WHERE review_id=$1`, [reviewId]);
    } else {
      // Tạo mới
      const insert = await client.query(
        `INSERT INTO contract_service_review (contract_service_id, reviewed_by, reviewed_for, comment)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [contractServiceId, reviewed_by, reviewed_for, comment]
      );
      reviewId = insert.rows[0].id;
    }

    // Thêm chi tiết tiêu chí nếu có
for (const c of criteriaList) {
  const isChecked = c.is_checked === true || c.is_checked === 'true';
  await client.query(
    `INSERT INTO contract_service_review_criteria (review_id, criteria_id, is_checked, score, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [reviewId, c.criteria_id, isChecked, c.score, c.note || null]
  );
}

    await client.query('COMMIT');
    return { id: reviewId };
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
