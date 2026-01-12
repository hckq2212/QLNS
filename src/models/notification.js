import db from '../config/db.js';

const notification = {
  // Lấy tất cả thông báo
  getAll: async (filters = {}) => {
    let query = 'SELECT * FROM notification WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.user_id) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(filters.user_id);
      paramIndex++;
    }

    if (filters.is_read !== undefined) {
      query += ` AND is_read = $${paramIndex}`;
      params.push(filters.is_read);
      paramIndex++;
    }

    if (filters.type) {
      query += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  },

  // Lấy thông báo theo ID
  getById: async (id) => {
    const result = await db.query(
      'SELECT * FROM notification WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  // Lấy thông báo theo user_id
  getByUserId: async (userId, limit = 50) => {
    const result = await db.query(
      'SELECT * FROM notification WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  },

  // Đếm số thông báo chưa đọc
  countUnread: async (userId) => {
    const result = await db.query(
      'SELECT COUNT(*) as unread_count FROM notification WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].unread_count);
  },

  // Tạo mới thông báo
  create: async (notificationData) => {
    const { user_id, title, type, payload, contract_id } = notificationData;
    
    const result = await db.query(
      `INSERT INTO notification (user_id, title, type, payload, contract_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user_id, title, type || null, payload ? JSON.stringify(payload) : null, contract_id || null]
    );
    return result.rows[0];
  },

  // Cập nhật thông báo
  update: async (id, updateData) => {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    if (updateData.title !== undefined) {
      fields.push(`title = $${paramIndex}`);
      params.push(updateData.title);
      paramIndex++;
    }

    if (updateData.type !== undefined) {
      fields.push(`type = $${paramIndex}`);
      params.push(updateData.type);
      paramIndex++;
    }

    if (updateData.payload !== undefined) {
      fields.push(`payload = $${paramIndex}`);
      params.push(JSON.stringify(updateData.payload));
      paramIndex++;
    }

    if (updateData.is_read !== undefined) {
      fields.push(`is_read = $${paramIndex}`);
      params.push(updateData.is_read);
      paramIndex++;
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = $${paramIndex}`);
    params.push(new Date());
    paramIndex++;

    params.push(id);

    const result = await db.query(
      `UPDATE notification SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    return result.rows[0];
  },

  // Đánh dấu đã đọc
  markAsRead: async (id) => {
    const result = await db.query(
      'UPDATE notification SET is_read = true, updated_at = $1 WHERE id = $2 RETURNING *',
      [new Date(), id]
    );
    return result.rows[0];
  },

  // Đánh dấu tất cả thông báo của user đã đọc
  markAllAsRead: async (userId) => {
    const result = await db.query(
      'UPDATE notification SET is_read = true, updated_at = $1 WHERE user_id = $2 AND is_read = false RETURNING *',
      [new Date(), userId]
    );
    return result.rows;
  },

  // Xóa thông báo
  delete: async (id) => {
    const result = await db.query(
      'DELETE FROM notification WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rowCount > 0;
  },

  // Xóa tất cả thông báo đã đọc của user
  deleteReadNotifications: async (userId) => {
    const result = await db.query(
      'DELETE FROM notification WHERE user_id = $1 AND is_read = true RETURNING *',
      [userId]
    );
    return result.rowCount;
  },
};

export default notification;
