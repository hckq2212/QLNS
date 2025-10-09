import db from '../config/db.js'

const opportunityServices    = {
    // insert multiple opportunity_service rows; conn can be a client or pool
    async createMany(opportunityId, services = [], conn = db) {
        if (!opportunityId) throw new Error('opportunityId required');
        if (!Array.isArray(services) || services.length === 0) return [];

        const runner = conn;
        const created = [];
        for (const s of services) {
            const serviceId = s.service_id;
            const serviceJobId = s.service_job_id || null;
            if (!serviceId) throw new Error('service_id is required for each service item');

            const quantity = s.quantity != null ? s.quantity : 1;
            if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('quantity must be a positive integer');

            const proposed = s.proposed_price != null ? s.proposed_price : null;
            if (proposed != null && (isNaN(proposed) || Number(proposed) < 0)) throw new Error('proposed_price must be a non-negative number');

            const note = s.note || null;

            // ensure service exists to avoid FK violation
            const svcCheck = await runner.query('SELECT id FROM service WHERE id = $1', [serviceId]);
            if (!svcCheck.rows || svcCheck.rows.length === 0) {
                throw new Error(`service id ${serviceId} not found`);
            }

            // try to insert service_job_id if provided (DB must have column)
            let res;
            if (serviceJobId) {
                res = await runner.query(
                    'INSERT INTO opportunity_service (opportunity_id, service_id, service_job_id, quantity, proposed_price, note) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
                    [opportunityId, serviceId, serviceJobId, quantity, proposed, note]
                );
            } else {
                res = await runner.query(
                    'INSERT INTO opportunity_service (opportunity_id, service_id, quantity, proposed_price, note) VALUES ($1,$2,$3,$4,$5) RETURNING *',
                    [opportunityId, serviceId, quantity, proposed, note]
                );
            }
            created.push(res.rows[0]);
        }
        return created;
    },

    async getByOpportunity(opportunityId) {
        const result = await db.query('SELECT * FROM opportunity_service WHERE opportunity_id = $1 ORDER BY id', [opportunityId]);
        return result.rows;
    }
}

export default opportunityServices;
