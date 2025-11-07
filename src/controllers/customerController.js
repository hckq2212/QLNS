import customerService from "../services/customerService.js";

const customerController = {
    getAllCustomer : async (req, res) => {
        try{
            const result = await customerService.getAllCustomer();
            return res.json(result);
        }catch(err){
            console.error('getAllCustomer error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getById : async (req, res) => {
        const customerId = req.params.id;
        try{
            const result = await customerService.getById(customerId);
            return res.json(result);
        }catch(err){
            console.error('getAllCustomer error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
      update: async (req, res) => {
        const id = req.params.id;
        try {
            const updated = await customerService.updateCustomer(id, req.body || {});
            if (!updated) return res.status(404).json({ error: 'Customer not found or nothing to update' });
            return res.json(updated);
        } catch (err) {
            console.error('updateCustomer error:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },
    create: async (req, res) => {
        try {
            const payload = req.body || {};
            const created = await customerService.createCustomer(payload);
            return res.status(201).json(created);
        } catch (err) {
            console.error('createCustomer error:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },
        removeCustomer: async (req, res) => {
        const id = req.params.id;
        try {
            const removed = await customerService.deleteCustomer(id);
            if (!removed) return res.status(404).json({ error: 'Customer not found' });
            return res.json({ success: true, customer: removed });
        } catch (err) {
            console.error('removeCustomer error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}


export default customerController;
