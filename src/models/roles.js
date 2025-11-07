import db from "../config/db.js";

const roles = {
  async getRoleByName(name) {
    if (!name) return null;
    const result = await db.query('SELECT id, name FROM "role" WHERE lower(name) = lower($1) LIMIT 1', [name]);
    return result.rows[0];
  },
  async getRoleByCode(code) {
    if (!code) return null;
    const result = await db.query('SELECT id, name FROM "role" WHERE lower(code) = lower($1) LIMIT 1', [code]);
    return result.rows[0];
  },

  async getRoleById(id) {
    if (!id) return null;
    const result = await db.query('SELECT id, code FROM "role" WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0];
  },
  async getMyRole(userId) {
    if (!userId) return null;
    const result = await db.query(
      `SELECT r.code
       FROM "user" u
       JOIN "role" r ON u.role_id = r.id
       WHERE u.id = $1
       LIMIT 1`,
      [userId]
    );
    // trả về chuỗi code hoặc null nếu không tìm thấy
    return result.rows[0] ? result.rows[0].code : null;
  },

  async getAll() {
    const result = await db.query('SELECT id, name FROM "role" ORDER BY id');
    return result.rows;
  }
};

export default roles;
