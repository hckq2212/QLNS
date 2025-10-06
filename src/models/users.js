import db from "../config/db.js";

// Note: the SQL dump defines the users table as `user` and the password column
// is `password`. Use parameterized queries to avoid SQL injection.
const users = {
  async getAll() {
    const result = await db.query('SELECT * FROM "user"');
    return result.rows;
  },
  async getUserByUsername(username) {
    const result = await db.query('SELECT * FROM "user" WHERE username = $1', [username]);
    return result.rows[0];
  },
  // passwordHash should be a hashed password value (not plain text)
  async createUser(username, passwordHash, full_name) {
    const result = await db.query(
      'INSERT INTO "user" (username, password, full_name) VALUES($1, $2, $3) RETURNING *',
      [username, passwordHash, full_name]
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

