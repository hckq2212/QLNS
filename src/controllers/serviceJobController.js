import serviceJobService from '../services/serviceJobService.js'

const serviceJobController = {
    getAll: async (req, res) => {
        try {
            const result = await serviceJobService.getAll();
            return res.json(result);;
        }catch (err){
            console.error(err)
        }
    },
    getById: async (req, res) => {
        const serviceJobId = req.params.id;
        try {
            const result = await serviceJobService.getById(serviceJobId);
            return res.json(result);;
        }catch (err){
            console.error(err)
        }
    },
    getByServiceId: async (req, res) => {
        const serviceId = req.params.id;
        try {
            const result = await serviceJobService.getByServiceId(serviceId);
            return res.json(result);;
        }catch (err){
            console.error(err)
        }
    }

    ,
    create: async (req, res) => {
        try {
            const payload = req.body || {};
            if (req.user && req.user.id) payload.created_by = payload.created_by || req.user.id;
            console.log(payload)
            const created = await serviceJobService.create(payload);
            return res.status(201).json(created);
        } catch (err) {
            console.error('Error creating service job', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    update: async (req, res) => {
        const id = req.params.id;
        try {
            const updated = await serviceJobService.update(id, req.body || {});
            if (!updated) return res.status(404).json({ error: 'Service job not found or nothing to update' });
            return res.json(updated);
        } catch (err) {
            console.error('Error updating service job', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    remove: async (req, res) => {
        const id = req.params.id;
        try {
            const removed = await serviceJobService.remove(id);
            if (!removed) return res.status(404).json({ error: 'Service job not found' });
            return res.json({ success: true, serviceJob: removed });
        } catch (err) {
            console.error('Error removing service job', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getServicesForJob: async (req, res) => {
  const jobId = req.params.id;
  try {
    const rows = await serviceJobService.getServicesForJob(jobId);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch services for job' });
  }
}
}

export default serviceJobController;