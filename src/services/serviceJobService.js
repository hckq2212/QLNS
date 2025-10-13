import serviceJobs from "../models/serviceJobs.js";

const serviceJobService = {
    getAll: async () => {
        const result = await serviceJobs.getAll();
        return result
    },
    getById: async (serviceJobId) => {
        const result = await serviceJobs.getById(serviceJobId);
        return result
    },
    getByServiceId: async (serviceJobId) => {
        const result = await serviceJobs.getByServiceId(serviceJobId);
        return result
    }
}

export default serviceJobService