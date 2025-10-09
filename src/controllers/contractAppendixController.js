import contractAppendixService from '../services/contractAppendixService.js'

const contractAppendixController = {
    create: async (req, res) => {
        try {
            const payload = req.body || {};
            if (req.user && req.user.id) payload.proposer_id = req.user.id;
            const created = await contractAppendixService.createAppendix(payload);
            return res.status(201).json(created);
        } catch (err) {
            console.error('create appendix error', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    approve: async (req, res) => {
        try {
            const id = req.params.id;
            const approverId = req.user && req.user.id;
            if (!approverId) return res.status(401).json({ error: 'Unauthorized' });
            const approved = await contractAppendixService.approveAppendix(id, approverId);
            if (!approved) return res.status(404).json({ error: 'Appendix not found or not pending' });
            return res.json(approved);
        } catch (err) {
            console.error('approve appendix error', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    getById: async (req, res) => {
        try {
            const id = req.params.id;
            const row = await contractAppendixService.getById(id);
            if (!row) return res.status(404).json({ error: 'Not found' });
            return res.json(row);
        } catch (err) {
            console.error('get appendix error', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    listByContract: async (req, res) => {
        try {
            const contractId = req.params.contractId;
            const rows = await contractAppendixService.listByContract(contractId);
            return res.json(rows);
        } catch (err) {
            console.error('list appendix error', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default contractAppendixController;
