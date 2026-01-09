import db from '../config/db.js';

const quote = {
  // Lấy tất cả báo giá
  getAll: async () => {
    const result = await db.query('SELECT id, status, comment, approved_at, approved_by FROM "quote" ORDER BY id');
    return result.rows; // Trả về danh sách các báo giá
  },

  // Lấy báo giá theo ID
  getById: async (id) => {
    const result = await db.query('SELECT id, status, comment, approved_at, approved_by FROM "quote" WHERE id = $1', [id]);
    return result.rows[0]; // Trả về báo giá theo ID
  },

  // Tạo mới một báo giá
  create: async (opportunity_service_ids, status, comment) => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // Tạo quote
      const quoteResult = await client.query(
        'INSERT INTO "quote" (status, comment) VALUES ($1, $2) RETURNING *',
        [status, comment]
      );
      const quote = quoteResult.rows[0];
      
      // Tạo các liên kết trong bảng quote_opportunity_service
      if (Array.isArray(opportunity_service_ids) && opportunity_service_ids.length > 0) {
        for (const oppServiceId of opportunity_service_ids) {
          await client.query(
            'INSERT INTO quote_opportunity_service (quote_id, opportunity_service_id) VALUES ($1, $2)',
            [quote.id, oppServiceId]
          );
        }
      }
      
      await client.query('COMMIT');
      return quote;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Cập nhật trạng thái báo giá
  update: async (id, status, comment) => {
    const result = await db.query(
      'UPDATE "quote" SET status = $1, comment = $2 WHERE id = $3 RETURNING *',
      [status, comment, id]
    );
    return result.rows[0]; // Trả về báo giá đã được cập nhật
  },

  // Xóa báo giá
  delete: async (id) => {
    const result = await db.query('DELETE FROM "quote" WHERE id = $1 RETURNING *', [id]);
    return result.rowCount > 0; // Nếu xóa thành công, trả về true
  },
};

export default quote;
