import db from "../config/db.js";

const teams = {
    getAll: async () => {
        const result = await db.query('SELECT * FROM team')
        return result.rows
    },
    getById: async (id) => {
        const result = await db.query('SELECT * FROM team WHERE id = $1', [id]);
        return result.rows[0]
    },
    create: async(name, description, lead_user_id) => {
        const result = await db.query('INSERT INTO team(name, description, lead_user_id) VALUES($1, $2, $3) RETURNING *',
            [name, description, lead_user_id]
        )
        return result.rows[0]
    },
    getMemberByTeamId: async (id) => {
        const result = await db.query('SELECT * FROM team_member WHERE team_id = $1',[id])
        return result.rows
    }
    ,
    async update(id, fields = {}) {
        const allowed = ['name', 'description', 'lead_user_id'];
        const setClauses = [];
        const params = [];
        let idx = 1;

        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(fields, key)) {
                setClauses.push(`${key} = $${idx}`);
                params.push(fields[key]);
                idx++;
            }
        }

        if (setClauses.length === 0) return null;

        params.push(id);
        const sql = `UPDATE team SET ${setClauses.join(', ')} , updated_at = now() WHERE id = $${idx} RETURNING *`;
        const result = await db.query(sql, params);
        return result.rows[0];
    }
}
export default teams;