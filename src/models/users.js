import db from "../config/db.js";

// Note: the SQL dump defines the users table as `user` and the password column
// is `password`. Use parameterized queries to avoid SQL injection.
const users = {
  async getAll() {
    const result = await db.query('SELECT username, full_name, role, email, phone, status FROM "user"');
    return result.rows;
  },
  async getUserByUsername(username) {
    const result = await db.query('SELECT username, full_name, role, email, phone, status FROM "user" WHERE username = $1', [username]);
    return result.rows[0];
  },
  // Returns full user row including password and refresh_token for auth flows
  async getAuthByUsername(username) {
    const result = await db.query('SELECT * FROM "user" WHERE username = $1', [username]);
    const row = result.rows[0];
    if (!row) return null;
    // normalize common password column names (password, password_hash)
    if (!row.password && row.password_hash) {
      row.password = row.password_hash;
    }
    return row;
  },
  // passwordHash should be a hashed password value (not plain text)
  async createUser(username, passwordHash, full_name, role) {
    const result = await db.query(
      'INSERT INTO "user" (username, password, full_name, role) VALUES($1, $2, $3, $4) RETURNING *',
      [username, passwordHash, full_name, role]
    );
    return result.rows[0];
  },
  async getUserById(id) {
    const result = await db.query('SELECT * FROM "user" WHERE id = $1', [id]);
    return result.rows[0];
  },
  async updateUserPasswordById(id, passwordHash) {
    const result = await db.query(
      'UPDATE "user" SET password = $1 WHERE id = $2 RETURNING *',
      [passwordHash, id]
    );
    return result.rows[0];
  },
  async updateUserRefreshTokenById(id, refreshToken) {
    const result = await db.query(
      'UPDATE "user" SET refresh_token = $1 WHERE id = $2 RETURNING *',
      [refreshToken, id]
    );
    return result.rows[0];
  }
};

export default users;

