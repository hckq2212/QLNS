import businessFieldService from '../services/businessFieldService.js';

const businessFieldController = {
    getAll: async (req, res) => {
        try {
            const result = await businessFieldService.getAllBusinessFields();
            return res.json(result);
        } catch (err) {
            console.error('getAll error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    getByCode: async (req, res) => {
        try {
            const code = req.params.code;
            const field = await businessFieldService.getBusinessFieldByCode(code);
            if (!field) return res.status(404).json({ error: 'Business field not found' });
            return res.json(field);
        } catch (err) {
            console.error('getByCode error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    create: async (req, res) => {
        try {
            const { code, name } = req.body;
            if (!code || !name) {
                return res.status(400).json({ error: 'Code and name are required' });
            }
            const created = await businessFieldService.createBusinessField({ code, name });
            return res.status(201).json(created);
        } catch (err) {
            console.error('create error:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    update: async (req, res) => {
        try {
            const code = req.params.code;
            const fields = req.body || {};
            const updated = await businessFieldService.updateBusinessField(code, fields);
            if (!updated) {
                return res.status(404).json({ error: 'Business field not found or no changes made' });
            }
            return res.json(updated);
        } catch (err) {
            console.error('update error:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    remove: async (req, res) => {
        try {
            const code = req.params.code;
            const deleted = await businessFieldService.deleteBusinessField(code);
            if (!deleted) return res.status(404).json({ error: 'Business field not found' });
            return res.json({ message: 'Deleted', item: deleted });
        } catch (err) {
            console.error('remove error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export default businessFieldController;
