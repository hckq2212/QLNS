import db from "../config/db.js";

const teams = {
    getAll: async () => {
        const result = await db.query('SELECT * FROM team')
        return result.rows
    },
    getyById: async (id) => {
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
}
export default teams;