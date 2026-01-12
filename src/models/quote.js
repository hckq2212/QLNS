import db from '../config/db.js';

const quote = {
  // Tạo quote mới
  create: async (opportunity_id, note = null) => {
    const result = await db.query(
      `INSERT INTO quote (opportunity_id, status, note) 
       VALUES ($1, 'pending', $2) 
       RETURNING *`,
      [opportunity_id, note]
    );
    return result.rows[0];
  },

  // Kiểm tra quote đã tồn tại cho opportunity
  checkExistsByOpportunityId: async (opportunityId) => {
    const result = await db.query(
      'SELECT id FROM quote WHERE opportunity_id = $1 LIMIT 1',
      [opportunityId]
    );
    return result.rows.length > 0;
  },

  // Lấy tất cả quotes
  getAll: async (filters = {}) => {
    let query = 'SELECT * FROM quote WHERE 1=1';
    const values = [];
    let i = 1;

    if (filters.status) {
      query += ` AND status = $${i++}`;
      values.push(filters.status);
    }

    if (filters.opportunity_id) {
      query += ` AND opportunity_id = $${i++}`;
      values.push(filters.opportunity_id);
    }

    query += ' ORDER BY id DESC';

    const result = await db.query(query, values);
    return result.rows;
  },

  // Lấy quote theo ID
  getById: async (id) => {
    const result = await db.query(
      'SELECT * FROM quote WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  // Lấy quote theo opportunity_id
  getByOpportunityId: async (opportunityId) => {
    const result = await db.query(
      'SELECT * FROM quote WHERE opportunity_id = $1',
      [opportunityId]
    );
    return result.rows[0];
  },

  // Cập nhật quote
  update: async (id, data) => {
    const fields = [];
    const values = [];
    let i = 1;

    if (data.status !== undefined) {
      fields.push(`status = $${i++}`);
      values.push(data.status);
    }

    if (data.note !== undefined) {
      fields.push(`note = $${i++}`);
      values.push(data.note);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await db.query(
      `UPDATE quote SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  // Xóa quote
  delete: async (id) => {
    const result = await db.query(
      'DELETE FROM quote WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rowCount > 0;
  }
};

export default quote;