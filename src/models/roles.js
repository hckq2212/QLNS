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
    const result = await db.query('SELECT id, code, name FROM "role" WHERE id = $1 LIMIT 1', [id]);
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
  ,
  async create(name, code) {
    const res = await db.query(
      `INSERT INTO "role" (name, code, created_at, updated_at) VALUES ($1, $2, now(), now()) RETURNING id, name, code`,
      [name, code]
    );
    return res.rows[0] || null;
  },
  async update(id, fields = {}) {
    const allowed = ['name', 'code'];
    const set = [];
    const params = [];
    let idx = 1;
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(fields, key) && fields[key] !== undefined && fields[key] !== null) {
        set.push(`${key} = $${idx}`);
        params.push(fields[key]);
        idx++;
      }
    }
    if (set.length === 0) return null;
    params.push(id);
    const sql = `UPDATE "role" SET ${set.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING id, name, code`;
    const result = await db.query(sql, params);
    return result.rows[0] || null;
  },
  async remove(id) {
    const res = await db.query('DELETE FROM "role" WHERE id = $1 RETURNING id, name, code', [id]);
    return res.rows[0] || null;
  }
};

export default roles;
