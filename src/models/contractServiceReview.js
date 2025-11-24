import db from '../config/db.js';

const contractServiceReviewModel = {
  // Lấy thông tin dịch vụ thuộc contract_service
  getServiceInfo: async (contractServiceId) => {
    const result = await db.query(`
      SELECT cs.id AS contract_service_id, s.id AS service_id, s.name AS service_name,
             c.id AS contract_id, c.name AS contract_name
      FROM contract_service cs
      JOIN service s ON s.id = cs.service_id
      JOIN contract c ON c.id = cs.contract_id
      WHERE cs.id = $1
    `, [contractServiceId]);
    return result.rows[0];
  },

  // Lấy danh sách tiêu chí (service_criteria)
  getCriteriaByService: async (contractServiceId) => {
    const result = await db.query(`
      SELECT sc.id, sc.name, sc.description, sc.weight
      FROM service_criteria sc
      JOIN contract_service cs ON cs.service_id = sc.service_id
      WHERE cs.id = $1
      ORDER BY sc.id
    `, [contractServiceId]);
    return result.rows;
  },

  // Lấy file đính kèm của các job thuộc service này
getResultByContractService: async (contractServiceId) => {
  const result = await db.query(`
    SELECT id AS contract_service_id, result
    FROM contract_service
    WHERE id = $1
  `, [contractServiceId]);
  return result.rows[0]; // chỉ 1 dòng
},
  // Lấy review hiện có (nếu đã chấm)
getExistingReview: async (contractServiceId) => {
  const result = await db.query(`
    SELECT 
      csr.id AS review_id,
      csr.comment,
      csr.total_score,
      csr.reviewed_by,
      csr.reviewed_for,
      u.full_name AS reviewer_name,
      csrc.criteria_id,
      csrc.is_checked,
      csrc.score,
      csrc.note,
      sc.name AS criteria_name,
      sc.weight
    FROM contract_service_review csr
    LEFT JOIN contract_service_review_criteria csrc ON csrc.review_id = csr.id
    LEFT JOIN service_criteria sc ON sc.id = csrc.criteria_id
    LEFT JOIN "user" u ON u.id = csr.reviewed_by
    WHERE csr.contract_service_id = $1
  `, [contractServiceId]);

  return result.rows.length ? result.rows : null;
},

    createReview: async (contractServiceId, reviewedBy, reviewedFor, comment, totalScore) => {
    const result = await db.query(`
      INSERT INTO contract_service_review (contract_service_id, reviewed_by, reviewed_for, comment, total_score)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [contractServiceId, reviewedBy, reviewedFor, comment, totalScore]);
    return result.rows[0];
  },

  // Thêm chi tiết tiêu chí review
  createReviewCriteria: async (reviewId, criteriaList = []) => {
    if (!criteriaList.length) return;
    const values = criteriaList.map(
      (c, i) => `($1, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, $${i * 4 + 5})`
    ).join(', ');

    const params = criteriaList.flatMap(c => [c.criteria_id, c.is_checked, c.score, c.note]);
    await db.query(`
      INSERT INTO contract_service_review_criteria (review_id, criteria_id, is_checked, score, note)
      VALUES ${values}
    `, [reviewId, ...params]);
  },

  // Lấy review đã có (nếu có)
  getReviewByContractService: async (contractServiceId) => {
    const result = await db.query(`
      SELECT csr.id AS review_id, csr.comment, csr.total_score, csr.reviewed_by, csr.reviewed_for,
             csrc.criteria_id, csrc.is_checked, csrc.score, csrc.note
      FROM contract_service_review csr
      LEFT JOIN contract_service_review_criteria csrc ON csrc.review_id = csr.id
      WHERE csr.contract_service_id = $1
    `, [contractServiceId]);
    return result.rows;
  }
};
export default contractServiceReviewModel