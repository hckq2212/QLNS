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
   assign: async (req, res) => {
        try {
            const id = req.params.id;
            const body = {
                assigned_id: req.body.assigned_id,
                description: req.body.description ?? null,
                status: 'assigning',
                start_date: req.body.start_date,
                deadline: req.body.deadline
            };
            if (!body.assigned_id) {
                return res.status(400).json({ error: 'Thiếu assigned_id' });
            }
            if (!body.start_date) {
                return res.status(400).json({ error: 'Thiếu ngày bắt đầu' });
            }
            if (!body.deadline) {
                return res.status(400).json({ error: 'Thiếu deadline' });
            }

            const result = await jobService.assign(id, body);
            return res.status(200).json(result);
        } catch (err) {
            console.error('Lỗi khi assign job', err);
            return res.status(500).json({ error: err.message || 'Internal server error' });
        }
        },

        getMyJob: async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Không tìm thấy người dùng từ token' });
        }
        const id = req.user.id
        try {
            const result = await jobService.getMyJob(id);
            return res.status(200).json(result)
        } catch (error) {
            console.error('Lỗi khi get công việc', error)
        }
    }


}

export default jobController;