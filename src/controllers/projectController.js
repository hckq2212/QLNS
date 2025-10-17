import projectService from '../services/projectService.js'
import contractService from '../services/contractService.js'

const projectController = {
    list: async (req, res) => {
        try {
            const result = await projectService.list();
            return res.json(result);
        } catch (err) {
            console.error('project list error', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    getById: async (req, res) => {
        try {
            const id = req.params.id;
            const p = await projectService.getById(id);
            if (!p) return res.status(404).json({ error: 'Project not found' });
            return res.json(p);
        } catch (err) {
            console.error('project getById error', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    create: async (req, res) => {
        try {
            const body = req.body || {};
            const creatorId = req.user && req.user.id;
            const created = await projectService.createProjectForContract(body.contract_id, body.name, body.description, body.start_date || null, creatorId);
            return res.status(201).json(created);
        } catch (err) {
            console.error('project create error', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },
    assignTeam: async (req, res) => {
        try{
            const id = req.params.id;
            const teamId = req.body.teamId
            const result = await projectService.assignTeam(id,teamId);
            return res.json(result)
        }catch(err){
            console.log("Lỗi khi assign team", err)
        }
    },

    assignJob: async (req, res) => {
        try {
            const projectId = req.params.id;
            const { jobId, assignedType, assignedId, externalCost, overrideReason, saveToCatalog } = req.body || {};
            const updated = await projectService.assignJob(projectId, jobId, assignedType, assignedId, externalCost, overrideReason, saveToCatalog);
            return res.json(updated);
        } catch (err) {
            console.error('project assignJob error', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    close: async (req, res) => {
        try {
            const projectId = req.params.id;
            const updated = await projectService.closeProject(projectId);
            return res.json(updated);
        } catch (err) {
            console.error('project close error', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    }

    ,
    // ack endpoint used by team lead to acknowledge project details
    ack: async (req, res) => {
        try {
            const projectId = req.params.id;
            const user = req.user || {};
            if (!user.id) return res.status(401).json({ error: 'Unauthorized' });
            // delegate to contractService which updates lead_ack_at
            const result = await contractService.ackProject(projectId, user.id);
            if (!result) return res.status(404).json({ error: 'Project not found' });
            return res.json(result);
        } catch (err) {
            console.error('project ack error', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default projectController;
