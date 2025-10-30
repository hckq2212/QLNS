import jobs from "../models/jobs.js";

const meService = {
    getMyJob: async(id) => {
        const result = await jobs.getMyJob(id);
        return result;
    },
}
export default meService
