import db from '../config/db.js'

const opportunityServices   = {
    async create(opportunity_id, service_id, quantity, note){
        const result = await db.query(
            "INSERT INTO opportunity_service(opportunity_id, service_id, quantity, note) VALUES($1, $2, $3, $4)",
            [opportunity_id, service_id, quantity, note]
        )
        return result.rows[0];
    },

    async createMany(opportunity_id, services) {
    const results = [];
    for (const s of services) {
        const result = await this.create(
            opportunity_id,
            s.service_id,
            s.quantity,
            s.note || null
        );
        results.push(result);
    }
    return results;
    },

    async getOpportunityService(opportunityId) {
        const result = await db.query('SELECT * FROM opportunity_service WHERE opportunity_id = $1', [opportunityId]);
        return result.rows;
    },
    async update(id, fields = {}) {
        const allowed = ['quantity', 'proposed_price', 'note'];
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

        if (setClauses.length === 0) return null; // nothing to update

        params.push(id);
        const sql = `UPDATE opportunity_service SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
        const result = await db.query(sql, params);
        return result.rows[0];
    },

    async getById(id) {
        const result = await db.query('SELECT * FROM opportunity_service WHERE id = $1', [id]);
        return result.rows[0];
    },

    async delete(id) {
        const result = await db.query(
            'DELETE FROM opportunity_service WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    }

}

export default opportunityServices;
