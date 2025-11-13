import serviceJobMappingService from "../services/serviceJobMappingService.js";

const serviceJobMappingController = {
    get: async (req, res) => {
        try {
            const { service_id, service_job_id } = req.query;
            let result;

            if (service_id) {
                result = await serviceJobMappingService.getByServiceId(service_id);
            } else if (service_job_id) {
                result = await serviceJobMappingService.getByJobId(service_job_id);
            } else {
                result = await serviceJobMappingService.getAll();
            }

            return res.json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },

    add: async (req, res) => {
        try {
            const { service_id, service_job_id } = req.body;
            const created = await serviceJobMappingService.addMapping(service_id, service_job_id);
            return res.status(201).json(created);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },

    remove: async (req, res) => {
        try {
            const { service_id, service_job_id } = req.body;
            const removed = await serviceJobMappingService.removeMapping(service_id, service_job_id);
            return res.json(removed);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
};

export default serviceJobMappingController;
