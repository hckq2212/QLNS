import db from '../config/db.js';

export const serviceJobCriteria = {
  getByServiceJobId: async (serviceJobId) => {
    const result = await db.query(`
      SELECT * FROM service_job_criteria
      WHERE service_job_id = $1
      ORDER BY id ASC
    `, [serviceJobId]);
    return result.rows;
  },

  getById: async (id) => {
    const result = await db.query(`
      SELECT * FROM service_job_criteria WHERE id = $1
    `, [id]);
    return result.rows[0];
  },

  create: async ({ service_job_id, name, description}) => {
    const result = await db.query(`
      INSERT INTO service_job_criteria (service_job_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [service_job_id, name, description]);
    return result.rows[0];
  },

  update: async (id, { name, description }) => {
    const result = await db.query(`
      UPDATE service_job_criteria
      SET name = COALESCE($2, name),
          description = COALESCE($3, description),
          created_at = created_at
      WHERE id = $1
      RETURNING *
    `, [id, name, description]);
    return result.rows[0];
  },

  remove: async (id) => {
    const result = await db.query(`
      DELETE FROM service_job_criteria WHERE id = $1 RETURNING id
    `, [id]);
    return result.rows[0];
  }
};
