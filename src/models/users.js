import db from "../config/db.js";
import roles from "./roles.js";

// NOTE: This project recently moved roles into a separate table ("role").
// The helpers below aim to be backward compatible by returning `role` as a string
// on returned user objects while storing `role_id` in the "user" table.

const users = {
  async getAll() {
    const result = await db.query(
      `SELECT u.id, u.username, u.full_name, r.code as role, u.email, u.phone, u.status 
      FROM "user" u 
      LEFT JOIN "role" r 
      ON r.id = u.role_id`
    );
    return result.rows;
  },

  async getUserByUsername(username) {
    const result = await db.query(
      'SELECT u.id, u.username, u.full_name, r.name as role, u.email, u.phone, u.status, u.refresh_token, u.role_id FROM "user" u LEFT JOIN "role" r ON r.id = u.role_id WHERE u.username = $1',
      [username]
    );
    return result.rows[0];
  },

  async getUserByEmail(email) {
    if (!email) return null;
    const result = await db.query(
      'SELECT u.id, u.username, u.full_name, r.name as role, u.email, u.phone, u.status, u.refresh_token, u.role_id FROM "user" u LEFT JOIN "role" r ON r.id = u.role_id WHERE lower(u.email) = lower($1)',
      [email]
    );
    return result.rows[0];
  },

  async getUserByPhoneNumber(phone) {
    if (!phone) return null;
    const result = await db.query(
      'SELECT u.id, u.username, u.full_name, r.name as role, u.email, u.phone, u.status, u.refresh_token, u.role_id FROM "user" u LEFT JOIN "role" r ON r.id = u.role_id WHERE u.phone = $1',
      [phone]
    );
    return result.rows[0];
  },

  async getAuthByUsername(username) {
    const result = await db.query(
      'SELECT u.id, u.username, u.password, u.refresh_token, r.name as role, u.role_id FROM "user" u LEFT JOIN "role" r ON r.id = u.role_id WHERE u.username = $1',
      [username]
    );
    const row = result.rows[0];
    if (!row) return null;
    return row;
  },

  // role param may be a role name (string) or a numeric id. If a name is given we
  // resolve it to an id using the roles helper.
  async createUser(username, passwordHash, full_name, role_id, phoneNumber, email, avatar='https://res.cloudinary.com/dmmsrmncn/image/upload/v1761535726/avatar_pfin2n.jpg') {


    const result = await db.query(
      'INSERT INTO "user" (username, password, full_name, role_id, phone, email, avatar) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, full_name, email, phone, status, created_at, role_id',
      [username, passwordHash, full_name, role_id, phoneNumber, email, avatar]
    );

    const created = result.rows[0];
    // map role name back into the returned object for compatibility
    if (created && created.role_id) {
      const r = await roles.getRoleById(created.role_id);
      created.role = r ? r.name : null;
    } else {
      created.role = null;
    }
    return created;
  },

  async getUserById(id) {
    const result = await db.query(
      'SELECT u.id, u.username, u.full_name, r.name as role, u.email, u.phone, u.status, u.created_at, u.refresh_token, u.role_id FROM "user" u LEFT JOIN "role" r ON r.id = u.role_id WHERE u.id = $1',
      [id]
    );
    return result.rows[0];
  },

  async update(id, fields = {}) {
    // Accept either `role` (name) or `role_id` in fields. Convert `role` to role_id.
    const allowed = ['username', 'full_name', 'phone', 'email', 'role_id', 'status'];

    const set = [];
    const params = [];
    let idx = 1;

    // handle role name provided as `role`
    if (Object.prototype.hasOwnProperty.call(fields, 'role') && fields.role !== undefined && fields.role !== null) {
      const r = await roles.getRoleByName(fields.role);
      fields.role_id = r ? r.id : null;
    }

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(fields, key) && fields[key] !== undefined && fields[key] !== null) {
        set.push(`${key} = $${idx}`);
        params.push(fields[key]);
        idx++;
      }
    }

    if (set.length === 0) return null;
    params.push(id);
    const sql = `UPDATE "user" SET ${set.join(', ')} WHERE id = $${idx} RETURNING id, username, full_name, email, phone, status, created_at, role_id`;
    const result = await db.query(sql, params);
    const updated = result.rows[0];
    if (updated && updated.role_id) {
      const r = await roles.getRoleById(updated.role_id);
      updated.role = r ? r.name : null;
    } else {
      updated.role = null;
    }
    return updated;
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
  async getPersonalInfo (id) {
    const result = await db.query(
      `SELECT username, full_name, phone, avatar, role_id FROM "user" WHERE id = $1`,
      [id]
    )
    return result.rows[0];
  }
};

export default users;

