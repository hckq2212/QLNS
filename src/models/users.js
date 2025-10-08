import db from "../config/db.js";

// Note: the SQL dump defines the users table as `user` and the password column
// is `password`. Use parameterized queries to avoid SQL injection.
const users = {
  async getAll() {
    const result = await db.query('SELECT username, full_name, role, email, phone, status FROM "user"');
    return result.rows;
  },
  async getUserByUsername(username) {
    // include id for callers that need the primary key
    const result = await db.query('SELECT id, username, full_name, role, email, phone, status FROM "user" WHERE username = $1', [username]);
    return result.rows[0];
  },
  // Returns full user row including id, password and refresh_token for auth flows
  async getAuthByUsername(username) {
    const result = await db.query('SELECT id, username, password, refresh_token, role FROM "user" WHERE username = $1', [username]);
    const row = result.rows[0];
    if (!row) return null;
    return row;
  },
  // passwordHash should be a hashed password value (not plain text)
  async createUser(username, passwordHash, full_name, role, phoneNumber, email) {
    // Do not return refresh_token here (it will be null on creation unless you set one)
    const result = await db.query(
      'INSERT INTO "user" (username, password, full_name, role, phone, email) VALUES($1, $2, $3, $4, $5, $6) RETURNING id, username, full_name, role, email, phone, status, created_at',
      [username, passwordHash, full_name, role, phoneNumber, email]
    );
    return result.rows[0];
  },
  async getUserById(id) {
    const result = await db.query('SELECT id, username, full_name, role, email, phone, status, created_at, refresh_token  FROM "user" WHERE id = $1', [id]);
    return result.rows[0];
  },
  // Update user profile fields. Allowed: username, full_name, phone, email, role, status
  async update(id, fields = {}) {
    const allowed = ['username', 'full_name', 'phone', 'email', 'role', 'status'];
    const set = [];
    const params = [];
    let idx = 1;
    for (const key of allowed) {
      // Only include the key if caller provided a non-null, non-undefined value
      if (Object.prototype.hasOwnProperty.call(fields, key) && fields[key] !== undefined && fields[key] !== null) {
        set.push(`${key} = $${idx}`);
        params.push(fields[key]);
        idx++;
      }
    }
    if (set.length === 0) return null;
    params.push(id);
    const sql = `UPDATE "user" SET ${set.join(', ')} WHERE id = $${idx} RETURNING id, username, full_name, role, email, phone, status, created_at`;
    const result = await db.query(sql, params);
    return result.rows[0];
  },
  async updateUserPasswordById(id, passwordHash) {
    const result = await db.query(
      'UPDATE "user" SET password = $1 WHERE id = $2 RETURNING id, username',
      [passwordHash, id]
    );
    return result.rows[0];
  },
  async updateUserRefreshTokenById(id, refreshToken) {
    const result = await db.query(
      'UPDATE "user" SET refresh_token = $1 WHERE id = $2 RETURNING id',
      [refreshToken, id]
    );
    return result.rows[0];
  },
  
};

export default users;

