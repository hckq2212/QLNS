import db from '../config/db.js'

const jobs = {
    getAll: async () => {
        const result = await db.query("SELECT * FROM job");
        return result.rows;
    },
    getById: async (id) => {
        const result = await db.query("SELECT * FROM job WHERE id = $1",[id]);
        return result.rows[0];
    },
    update: async (id, fields = {}) => {
  // Chuẩn hoá trước khi build SQL
  const normalizeJsonb = (v) => {
    if (v === undefined) return undefined;            // bỏ qua
    if (v === null) return null;                      // cho phép xóa (NULL)
    if (typeof v === 'string') return v;              // đã là JSON string?
    try { return JSON.stringify(v); } catch { return v; }
  };

    const allowed = [
    'assigned_type',
    'assigned_id',
    'description',
    'external_cost',
    'status',
    'start_date',
    'end_date',
    'deadline',
    'evidence',     // jsonb
    'attachments',  // jsonb
    ];

    const setClauses = [];
    const params = [];
    let idx = 1;

    for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(fields, key)) continue;

    // ép kiểu jsonb cho 2 cột mảng
    if (key === 'attachments' || key === 'evidence') {
        setClauses.push(`${key} = $${idx}::jsonb`);
        params.push(normalizeJsonb(fields[key]));
    } else {
        setClauses.push(`${key} = $${idx}`);
        params.push(fields[key]);
    }
    idx++;
    }

    if (setClauses.length === 0) return null;

    // luôn cập nhật updated_at
    const sql = `
    UPDATE job
        SET ${setClauses.join(', ')},
            updated_at = now()
        WHERE id = $${idx}
        RETURNING *`;
    params.push(id);

    const result = await db.query(sql, params);
    return result.rows[0] || null;
    },
    getByProject: async(id) => {
        const result = await db.query('SELECT * FROM job WHERE project_id = $1',
            [id]
        )
        return result.rows
    },
    getMyJob: async (id) => {
        const result = await db.query(
            `
            SELECT * FROM job
            WHERE assigned_id = $1 
            AND assigned_type = 'user'
            `,
            [id]
        )
        return result.rows;
    }
}

export default jobs;