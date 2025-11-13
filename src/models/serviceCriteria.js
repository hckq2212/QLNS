import db from '../config/db.js';

export const serviceCriteria = {
  // Lấy tất cả tiêu chí của 1 service
  getByServiceId: async (serviceId) => {
    const result = await db.query(
      `SELECT * FROM service_criteria
       WHERE service_id = $1
       ORDER BY id ASC`,
      [serviceId]
    );
    return result.rows;
  },

  // Lấy 1 tiêu chí cụ thể
  getById: async (id) => {
    const result = await db.query(
      `SELECT * FROM service_criteria WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Tạo tiêu chí mới
  create: async ({ service_id, name, description, weight = 1, is_active = true }) => {
    const result = await db.query(
      `INSERT INTO service_criteria (service_id, name, description, weight, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [service_id, name, description, weight, is_active]
    );
    return result.rows[0];
  },

  // Cập nhật tiêu chí
  update: async (id, { name, description, weight, is_active }) => {
    const result = await db.query(
      `UPDATE service_criteria
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           weight = COALESCE($4, weight),
           is_active = COALESCE($5, is_active),
           created_at = created_at
       WHERE id = $1
       RETURNING *`,
      [id, name, description, weight, is_active]
    );
    return result.rows[0];
  },

  // Xoá tiêu chí
  remove: async (id) => {
    const result = await db.query(
      `DELETE FROM service_criteria WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows[0];
  }
};
