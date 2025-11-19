import partnerServiceJobModel from '../models/partnerServiceJobModel.js';

const partnerServiceJobService = {
    create: async (payload) => {
        const { partner_id, service_job_id, base_cost, note } = payload;

        if (!partner_id) throw new Error("partner_id is required");
        if (!service_job_id) throw new Error("service_job_id is required");

        // Validate base_cost
        if (base_cost != null && Number(base_cost) < 0) {
            throw new Error("base_cost must be >= 0");
        }

        // Tạo mapping (DB sẽ reject nếu trùng UNIQUE(partner_id, service_job_id))
        return await partnerServiceJobModel.create(partner_id, service_job_id, base_cost, note);
    },

    getAll: async () => {
        return await partnerServiceJobModel.getAll();
    },

    getByPartner: async (partner_id) => {
        if (!partner_id) throw new Error("partner_id required");
        return await partnerServiceJobModel.getByPartner(partner_id);
    },

    getByServiceJob: async (service_job_id) => {
        if (!service_job_id) throw new Error("service_job_id required");
        return await partnerServiceJobModel.getByServiceJob(service_job_id);
    },
    update: async (id, payload) => {
        if (!id) throw new Error('id is required');
        const { base_cost = null, note = null } = payload || {};

        if (base_cost != null && Number(base_cost) < 0) {
            throw new Error('base_cost must be >= 0');
        }

        const updated = await partnerServiceJobModel.update(id, base_cost, note);
        if (!updated) throw new Error('Mapping không tồn tại');
        return updated;
    },
};

export default partnerServiceJobService