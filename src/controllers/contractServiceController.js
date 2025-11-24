import contractService from '../services/contractService.js';
import contractServicesService from '../services/contractServicesService.js';

const contractServiceController = {
    // POST /contract-service/:id/result
    saveResult: async (req, res) => {
        try {
            const id = req.params.id;
            const { url, description } = req.body || {};
            const userId = req.user?.id || null;
            if (!url) return res.status(400).json({ error: 'url is required' });
            console.log("RAW BODY:", req.body);

            console.log({ url, description })
            const updated = await contractService.saveResultLink(id, url, userId, description);
            return res.json({ message: 'Saved', item: updated });
        } catch (err) {
            console.error('saveResult error:', err && (err.stack || err.message) || err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    }
    ,
    // CRUD for contract_service
    getAll: async (req, res) => {
        try {
            const rows = await contractServicesService.getAll();
            return res.json(rows);
        } catch (err) {
            console.error('contract_service.getAll error', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getById: async (req, res) => {
        try {
            const id = req.params.id;
            const row = await contractServicesService.getById(id);
            if (!row) return res.status(404).json({ error: 'Not found' });
            return res.json(row);
        } catch (err) {
            console.error('contract_service.getById error', err);
            return res.status(400).json({ error: err.message });
        }
    },
    getByContract: async (req, res) => {
        try {
            const contractId = req.params.contractId;
            const rows = await contractServicesService.getByContract(contractId);
            return res.json(rows);
        } catch (err) {
            console.error('contract_service.getByContract error', err);
            return res.status(400).json({ error: err.message });
        }
    },
    create: async (req, res) => {
        try {
            const payload = req.body || {};
            const userId = req.user?.id || null;
            const created = await contractServicesService.create(payload, userId);
            return res.status(201).json(created);
        } catch (err) {
            console.error('contract_service.create error', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const payload = req.body || {};
            const updated = await contractServicesService.update(id, payload);
            return res.json(updated);
        } catch (err) {
            console.error('contract_service.update error', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },
    remove: async (req, res) => {
        try {
            const id = req.params.id;
            const removed = await contractServicesService.remove(id);
            return res.json({ message: 'Deleted', item: removed });
        } catch (err) {
            console.error('contract_service.remove error', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },
     updateResultItem: async (req, res) => {
        try {
            const { id, index } = req.params;
            const { url, description } = req.body || {};

            if (!url) return res.status(400).json({ error: "url is required" });

            const updated = await contractService.updateResultItem(
                id,
                Number(index),
                { url, description: description ?? "" }
            );

            res.json({ message: "Updated", item: updated });
        } catch (err) {
            console.error("updateResultItem error:", err);
            res.status(400).json({ error: err.message });
        }
    },

    // DELETE /contract-service/:id/result/:index
    deleteResultItem: async (req, res) => {
        try {
            const { id, index } = req.params;

            const updated = await contractService.deleteResultItem(
                id,
                Number(index)
            );

            res.json({ message: "Deleted", item: updated });
        } catch (err) {
            console.error("deleteResultItem error:", err);
            res.status(400).json({ error: err.message });
        }
    }
};

export default contractServiceController;
