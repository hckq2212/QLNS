import db from '../config/db.js';

export const acceptance = {
  createDraft: async ({ project_id, created_by, comment, jobs, result = [] }) => {
    const res = await db.query(`
      INSERT INTO acceptance (project_id, created_by, comment, jobs, result, status)
      VALUES ($1, $2, $3, $4, $5, 'draft')
      RETURNING *
    `, [project_id, created_by, comment, JSON.stringify(jobs || []), JSON.stringify(result || [])]);
    return res.rows[0];
  },

  updateStatus: async (id, status, approvedBy = null) => {
    const field = status === 'approved' ? 'approved_at' : 'updated_at';
    const res = await db.query(`
      UPDATE acceptance
      SET status = $2,
          approved_by = COALESCE($3, approved_by),
          ${field} = now()
      WHERE id = $1
      RETURNING *
    `, [id, status, approvedBy]);
    return res.rows[0];
  },

  getById: async (id) => {
    const res = await db.query(`SELECT * FROM acceptance WHERE id = $1`, [id]);
    return res.rows[0];
  },

  updateMailSent: async (id) => {
    const res = await db.query(`
      UPDATE acceptance
      SET mail_sent_at = now()
      WHERE id = $1
      RETURNING *
    `, [id]);
    return res.rows[0];
  }
};
