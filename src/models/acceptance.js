import db from '../config/db.js';

export const acceptance = {
  createDraft: async ({ project_id, created_by, comment, jobs, result = [] }) => {
    const { rows } = await db.query(
    `
    INSERT INTO acceptance (project_id, created_by, comment, jobs, result)
    VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
    RETURNING *;
    `,
    [
      project_id,
      created_by,
      comment,
      JSON.stringify(jobs ?? []),
      JSON.stringify(result ?? []),
    ],
  );

  return rows[0];
  },
// acceptanceRepo.js (hoặc nơi bạn đặt acceptance.*)
updateResultStatusByJobId: async (acceptanceId, jobId, nextStatus) => {
  const res = await db.query(
    `
    UPDATE acceptance a
    SET result = (
      SELECT jsonb_agg(
        CASE
          WHEN (elem->>'job_id')::int = $2 THEN
            jsonb_set(
              jsonb_set(elem, '{status}', to_jsonb($3::text), true),
              '{is_accepted}',
              CASE WHEN $3 = 'accepted' THEN 'true'::jsonb ELSE 'false'::jsonb END,
              true
            )
          ELSE elem
        END
        ORDER BY ord
      )
      FROM jsonb_array_elements(COALESCE(a.result, '[]'::jsonb))
           WITH ORDINALITY AS e(elem, ord)
    )
    WHERE a.id = $1
    RETURNING *;
    `,
    [Number(acceptanceId), Number(jobId), nextStatus]
  );

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

  // getById: async (id) => {
  //   const res = await db.query(`SELECT * FROM acceptance WHERE id = $1`, [id]);
  //   return res.rows[0];
  // },

 getById: async (id) => {
  const query = `
    SELECT 
      a.id,
      a.project_id,
      p.name AS project_name,
      a.status,
      a.comment,
      a.created_by,
      u1.full_name AS created_by_name,
      a.created_at,
      a.approved_by,
      u2.full_name AS approved_by_name,
      a.approved_at,
      a.jobs,
      a.result,
      jsonb_array_length(COALESCE(a.jobs, '[]'::jsonb)) AS total_jobs,
      (
        SELECT COUNT(*)
        FROM jsonb_array_elements(COALESCE(a.result, '[]'::jsonb)) elem
        WHERE elem->>'status' = 'approved'
      ) AS accepted_jobs
    FROM acceptance a
    LEFT JOIN "user" u1 ON u1.id = a.created_by
    LEFT JOIN "user" u2 ON u2.id = a.approved_by
    LEFT JOIN project p ON p.id = a.project_id
    WHERE a.id = $1
  `;

  const res = await db.query(query, [id]);
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
  },

  getByProject : async (projectId) => {
    const query = `
      SELECT 
        a.id,
        a.project_id,
        a.status,
        a.comment,
        a.created_by,
        u.full_name AS created_by_name,
        a.created_at,
        a.approved_by,
        a.approved_at,
        a.jobs,
        a.result,
        jsonb_array_length(a.jobs) AS total_jobs,
        (
          SELECT COUNT(*)
          FROM jsonb_array_elements(a.result) elem
          WHERE (elem->>'is_accepted')::boolean = true
        ) AS accepted_jobs
      FROM acceptance a
      LEFT JOIN "user" u ON u.id = a.created_by
      WHERE a.project_id = $1
      ORDER BY a.created_at DESC
    `;

    const res = await db.query(query, [projectId]);
    return res.rows;
  }
};
