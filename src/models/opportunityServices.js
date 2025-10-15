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
    }
}

export default opportunityServices;
