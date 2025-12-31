import db from '../config/db.js';

export const jobReview = {
  getJobInfo: async (jobId) => {
    const result = await db.query(`
      SELECT j.id AS job_id, j.name AS job_name, s.id AS service_id, s.name AS service_name
      FROM job j
      LEFT JOIN service s ON s.id = j.service_id
      WHERE j.id = $1
    `, [jobId]);
    return result.rows[0];
  },

  getCriteriaByJob: async (jobId) => {
    const result = await db.query(`
      SELECT sjc.id, sjc.name, sjc.description
      FROM job j
      JOIN service_job sj ON sj.id = j.service_job_id
      JOIN service_job_criteria sjc ON sjc.service_job_id = sj.id
      WHERE j.id = $1
      ORDER BY sjc.id
    `, [jobId]);
    return result.rows;
  },

  getReview: async (jobId, type) => {
    const result = await db.query(`
      SELECT jr.id AS review_id, jr.comment, jr.total_score, jr.reviewed_by,
             jrc.criteria_id, jrc.is_checked, jrc.note, sjc.name AS criteria_name
      FROM job_review jr
      LEFT JOIN job_review_criteria jrc ON jrc.review_id = jr.id
      LEFT JOIN service_job_criteria sjc ON sjc.id = jrc.criteria_id
      WHERE jr.job_id = $1 AND jr.review_type = $2
    `, [jobId, type]);
    return result.rows;
  },

createReview: async (jobId, type, reviewedBy, comment, is_passed) => {
  const result = await db.query(`
    INSERT INTO job_review (job_id, review_type, reviewed_by, comment, is_passed)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (job_id, review_type)
    DO UPDATE
      SET comment = $4,
          reviewed_by = $3,
          is_passed = $5,
          updated_at = now()
    RETURNING id;
  `, [jobId, type, reviewedBy, comment, is_passed]);
  return result.rows[0];
},


  insertCriteria: async (reviewId, criteriaList) => {
    for (const c of criteriaList) {
      const isChecked = c.is_checked === true || c.is_checked === 'true';
      await db.query(`
        INSERT INTO job_review_criteria (review_id, criteria_id, is_checked, score, note)
        VALUES ($1, $2, $3, $4, $5)
      `, [reviewId, c.criteria_id, isChecked, c.score, c.note || null]);
    }
  },
  createBaseReview: async (jobId, reviewType, reviewedBy = null) => {
    const result = await db.query(`
      INSERT INTO job_review (job_id, review_type, reviewed_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (job_id, review_type) DO NOTHING
      RETURNING id
    `, [jobId, reviewType, reviewedBy]);
    return result.rows[0];
  },

  createReviewCriteriaFromTemplate: async (reviewId, jobId) => {
    await db.query(`
      INSERT INTO job_review_criteria (review_id, criteria_id)
      SELECT $1, sjc.id
      FROM service_job_criteria sjc
      JOIN job j ON j.service_job_id = sjc.service_job_id
      WHERE j.id = $2
    `, [reviewId, jobId]);
  }


};
