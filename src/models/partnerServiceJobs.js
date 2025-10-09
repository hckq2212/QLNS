import db from '../config/db.js'

const partnerServiceJobs = {
    async findByPartnerAndJob(partnerId, serviceJobId) {
        if (!partnerId || !serviceJobId) return null;
        const result = await db.query(
            'SELECT * FROM partner_service_job WHERE partner_id = $1 AND service_job_id = $2 LIMIT 1',
            [partnerId, serviceJobId]
        );
        return result.rows && result.rows.length > 0 ? result.rows[0] : null;
    },

    async upsert(partnerId, serviceJobId, externalCost) {
        if (!partnerId || !serviceJobId) throw new Error('partnerId and serviceJobId are required');
        if (externalCost == null) throw new Error('externalCost is required');

        const result = await db.query(
            `INSERT INTO partner_service_job (partner_id, service_job_id, external_cost, created_at, updated_at)
             VALUES ($1, $2, $3, now(), now())
             ON CONFLICT (partner_id, service_job_id)
             DO UPDATE SET external_cost = EXCLUDED.external_cost, updated_at = now()
             RETURNING *`,
            [partnerId, serviceJobId, externalCost]
        );
        return result.rows[0];
    }
}

export default partnerServiceJobs;