import jobService from "../services/jobService.js";

const jobController = {
    getAll: async (req, res) => {
        try{
            const result = await jobService.getAll();
            return res.json(result);
        }catch(err){
            console.error(`Lỗi khi get all công việc: ${err}`)
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getById: async (req, res) => {
        const jobId = req.params.id;
        try{
            const result = await jobService.getById(jobId);
            return res.json(result);
        }catch(err){
            console.error(`Looix khi get Job by id: ${err}`)
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    create: async (req, res) => {
        const payload = req.body || {}
        try{
            const result = await jobService.create(payload);
            return res.json(result)
        }catch(err){
            console.error("Lỗi khi tạo job")
        }
    },
    update: async (req, res) => {
        try {
            const jobId = req.params.id;
            const payload = req.body || {}
            const result = await jobService.update(jobId, payload);
            if (!result) return res.status(404).json({ error: 'Job not found' });
            return res.status(200).json(result);
        } catch (err) {
            console.error('Error in jobController.update', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getByProject: async(req, res) => {
        try{
            const id = req.params.projectId;
            const result = await jobService.getByProject(id);
            return res.json(result)
        }catch(err){

        }
    },

}

export default jobController;