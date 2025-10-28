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
    const result = await db.query('SELECT id, name FROM "role" WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0];
  },

  async getAll() {
    const result = await db.query('SELECT id, name FROM "role" ORDER BY id');
    return result.rows;
  }
};

export default roles;
