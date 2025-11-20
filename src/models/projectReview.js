import db from '../config/db.js';

const projectReview = {
  // Lấy danh sách service trong hợp đồng thuộc project
  getContractServicesByProject: async (projectId) => {
    const result = await db.query(`
      SELECT cs.id AS contract_service_id, s.id AS service_id
      FROM project p
      JOIN contract c ON c.id = p.contract_id
      JOIN contract_service cs ON cs.contract_id = c.id
      JOIN service s ON s.id = cs.service_id
      WHERE p.id = $1
    `, [projectId]);
    return result.rows;
  },

  // Đổi trạng thái project sang review
  updateProjectStatusToReview: async (projectId) => {
    const result = await db.query(`
      UPDATE project
      SET status = 'review', updated_at = now()
      WHERE id = $1
      RETURNING *
    `, [projectId]);
    return result.rows[0];
  },

  // Tạo bản review cho 1 contract_service (nếu chưa có)
  createContractServiceReview: async (contractServiceId, reviewedBy) => {
    const result = await db.query(`
      INSERT INTO contract_service_review (contract_service_id, reviewed_by)
      VALUES ($1, $2)
      ON CONFLICT (contract_service_id) DO NOTHING
      RETURNING id
    `, [contractServiceId, reviewedBy]);
    return result.rows[0];
  },

  // Tạo tiêu chí review chi tiết từ service_criteria
  createReviewCriteria: async (reviewId, serviceId) => {
    await db.query(`
      INSERT INTO contract_service_review_criteria (review_id, criteria_id)
      SELECT $1, sc.id
      FROM service_criteria sc
      WHERE sc.service_id = $2
    `, [reviewId, serviceId]);
  }
};
export default projectReview