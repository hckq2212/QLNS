import db from '../config/db.js'

const opportunityServices    = {
    // insert multiple opportunity_service rows; conn can be a client or pool
    // async createMany(opportunityId, services = [], conn = db) {
    //     if (!opportunityId) throw new Error('opportunityId required');
    //     if (!Array.isArray(services) || services.length === 0) return [];

    //     const runner = conn;
    //     const created = [];
    //     for (const s of services) {
    //         const serviceId = s.service_id;
    //         const serviceJobId = s.service_job_id || null;
    //         if (!serviceId) throw new Error('service_id is required for each service item');

    //         const quantity = s.quantity != null ? s.quantity : 1;
    //         if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('quantity must be a positive integer');

    //         const proposed = s.proposed_price != null ? s.proposed_price : null;
    //         if (proposed != null && (isNaN(proposed) || Number(proposed) < 0)) throw new Error('proposed_price must be a non-negative number');

    //         const note = s.note || null;

    //         // ensure service exists to avoid FK violation
    //         const svcCheck = await runner.query('SELECT id FROM service WHERE id = $1', [serviceId]);
    //         if (!svcCheck.rows || svcCheck.rows.length === 0) {
    //             throw new Error(`service id ${serviceId} not found`);
    //         }

    //         if (serviceJobId) {
    //             const serviceJobCheck = await runner.query('SELECT service_id FROM service_job WHERE id = $1', [serviceJobId]);
    //             if (!serviceJobCheck.rows || serviceJobCheck.rows.length === 0) {
    //                 throw new Error(`service_job id ${serviceJobId} not found`);
    //             }
    //             const sjServiceId = serviceJobCheck.rows[0].service_id;
    //             if (sjServiceId != null && Number(sjServiceId) !== Number(serviceId)) {
    //                 throw new Error('service_job does not belong to the provided service');
    //             }
    //         }


    //         // Use upsert to avoid duplicate key errors when (opportunity_id, service_id) already exists.
    //         // Always pass service_job_id (nullable) so we can use a single query and update fields on conflict.
    //         const upsertSql = `
    //             INSERT INTO opportunity_service (opportunity_id, service_id, service_job_id, quantity, proposed_price, note)
    //             VALUES ($1,$2,$3,$4,$5,$6)
    //             ON CONFLICT (opportunity_id, service_id)
    //             DO UPDATE SET
    //                 service_job_id = EXCLUDED.service_job_id,
    //                 quantity = EXCLUDED.quantity,
    //                 proposed_price = EXCLUDED.proposed_price,
    //                 note = EXCLUDED.note
    //             RETURNING *
    //         `;

    //         const res = await runner.query(upsertSql, [opportunityId, serviceId, serviceJobId, quantity, proposed, note]);
    //         created.push(res.rows[0]);
    //     }
    //     return created;
    // },

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

    async getByOpportunity(opportunityId) {
        const result = await db.query('SELECT * FROM opportunity_service WHERE opportunity_id = $1 ORDER BY id', [opportunityId]);
        return result.rows;
    }
}

export default opportunityServices;
