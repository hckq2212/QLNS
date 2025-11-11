import partnerService from '../services/partnerService.js'

const partnerController = {
    getAll: async (req, res) => {
        try {
            const rows = await partnerService.getAll();
            return res.json(rows);
        } catch (err) {
            console.error('getAll partners error', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    getById: async (req, res) => {
        const id = req.params.id;
        try {
            const p = await partnerService.getById(id);
            if (!p) return res.status(404).json({ error: 'Partner not found' });
            return res.json(p);
        } catch (err) {
            console.error('getById partner error', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    create: async (req, res) => {
        try {
            const payload = req.body || {};
            if (req.user && req.user.id) payload.created_by = payload.created_by || req.user.id;
            const created = await partnerService.create(payload);
            return res.status(201).json(created);
        } catch (err) {
            console.error('create partner error', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    update: async (req, res) => {
        const id = req.params.id;
        try {
            const updated = await partnerService.update(id, req.body || {});
            if (!updated) return res.status(404).json({ error: 'Partner not found or nothing to update' });
            return res.json(updated);
        } catch (err) {
            console.error('update partner error', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    remove: async (req, res) => {
        const id = req.params.id;
        try {
            const removed = await partnerService.remove(id);
            if (!removed) return res.status(404).json({ error: 'Partner not found' });
            return res.json({ success: true, partner: removed });
        } catch (err) {
            console.error('remove partner error', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default partnerController;
