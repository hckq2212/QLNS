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
    update: async(id, payload) => {
        const result = await jobs.update(id, payload);
        return result
    },
    create: async(payload) => {
        const result = await jobs.create(payload);
        return result;
    },
    getByProject: async(id) => {
        const result = await jobs.getByProject(id);
        return result;
    },

    assign: async(id, body) => {
        const result = await jobs.update(id, body);
        if(!result) throw new Error('Lỗi khi thực hiện assign job')
        return result
    }

}

export default jobService