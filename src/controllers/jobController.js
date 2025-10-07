import jobService from "../services/jobService.js";

const jobController = {
    getAll: async (req, res) => {
        try{
            const result = await jobService.getAll();
            return res.json(result);
        }catch(err){
            console.error(`Lỗi khi get all công việc: ${err}`)
        }
    },
    getById: async (req, res) => {
        const jobId = req.params.id;
        try{
            const result = await jobService.getById(jobId);
            return res.json(result);
        }catch(err){
            console.error(`Looix khi get Job by id: ${err}`)
        }
    }
}

export default jobController;