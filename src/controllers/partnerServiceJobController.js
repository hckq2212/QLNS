import partnerServiceJobService from '../services/partnerServiceJobService.js';

const partnerServiceJobController = {
    create: async (req, res) => {
        try {
            const created = await partnerServiceJobService.create(req.body);
            return res.status(201).json(created);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const data = await partnerServiceJobService.getAll();
            return res.json(data);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },


    getByPartner: async (req, res) => {
        try {
            const data = await partnerServiceJobService.getByPartner(req.params.partner_id);
            return res.json(data);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },

    getByServiceJob: async (req, res) => {
        try {
            const data = await partnerServiceJobService.getByServiceJob(req.params.service_job_id);
            return res.json(data);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const updated = await partnerServiceJobService.update(id, req.body);
            return res.json(updated);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },
};

export default partnerServiceJobController