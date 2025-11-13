import serviceJobMapping from "../models/serviceJobMapping.js";

const serviceJobMappingService = {
    getAll: async () => {
        return await serviceJobMapping.getAll();
    },

    getByServiceId: async (serviceId) => {
        if (!serviceId) throw new Error("Thiếu service_id");
        return await serviceJobMapping.getByServiceId(serviceId);
    },

    getByJobId: async (serviceJobId) => {
        if (!serviceJobId) throw new Error("Thiếu service_job_id");
        return await serviceJobMapping.getByJobId(serviceJobId);
    },

    addMapping: async (service_id, service_job_id) => {
        if (!service_id || !service_job_id) {
            throw new Error("Thiếu service_id hoặc service_job_id");
        }

        const created = await serviceJobMapping.create({ service_id, service_job_id });
        return created || { message: "Mapping đã tồn tại hoặc không thể tạo" };
    },

    removeMapping: async (service_id, service_job_id) => {
        if (!service_id || !service_job_id) {
            throw new Error("Thiếu service_id hoặc service_job_id");
        }

        const removed = await serviceJobMapping.remove({ service_id, service_job_id });
        return removed || { message: "Mapping không tồn tại" };
    }
};

export default serviceJobMappingService;
