import jobs from "../models/jobs.js";

const jobService = {
    getAll: async () => {
        const result = await jobs.getAll();
        return result;
    },
    getById: async (jobId) => {
        const result = await jobs.getById(jobId);
        return result;
    },
    update: async (jobId, fields) => {
        if (!jobId) throw new Error('jobId required');
        const result = await jobs.update(jobId, fields);
        return result;
    },

}

export default jobService