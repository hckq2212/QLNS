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
            const { status, progress_percent } = req.body;
            if (status == null && progress_percent == null) return res.status(400).json({ error: 'Missing status or progress_percent in body' });
            const result = await jobService.update(jobId, { status, progress_percent });
            if (!result) return res.status(404).json({ error: 'Job not found' });
            return res.json(result);
        } catch (err) {
            console.error('Error in jobController.update', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

}

export default jobController;