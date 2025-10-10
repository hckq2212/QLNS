import contractService from "../services/contractService.js";


const contractController = {
    getAll: async (req, res) => {
        try {
            const result = await contractService.getAll();
            return res.json(result);
        }catch(err){
            console.error('getAll contracts error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getAllPending: async (req, res) => {
        try {
            const result = await contractService.getAllPending();
            return res.json(result);
        }catch(err){
            console.error('getAllPending contracts error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getById: async (req, res) => {
        const contractId =  req.params.id;

        try{   
            const result = await contractService.getById(contractId);
            if (!result) return res.status(404).json({ error: 'Contract not found' });
            return res.json(result);
        }catch(err){
            console.error('getById contract error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    create: async (req, res) => {
        if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized' });
        const creatorId = req.user.id;
        const body = {
            opportunityId : req.body.opportunityId,
            customerId : req.body.customerId,
            totalCost: req.body.totalCost,
            customerTemp: req.body.customer_temp
        }
        try {
            const result = await contractService.create(body.opportunityId, body.customerId, body.totalCost, body.customerTemp, creatorId);
            return res.status(201).json(result);
        } catch (err) {
            console.error('create contract error:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    }

    ,
    hrConfirm: async (req, res) => {
        try {
            const id = req.params.id;
            const user = req.user || {};
            // only HR role can hr-confirm
            if (!user.role || (user.role !== 'hr' && user.role !== 'admin')) return res.status(403).json({ error: 'Forbidden' });
            const userId = user.id;
            const updated = await contractService.updateStatus(id, 'waiting_hr_confirm', userId);
            if (!updated) return res.status(404).json({ error: 'Contract not found' });
            return res.json(updated);
        } catch (err) {
            console.error('hrConfirm err', err);
            return res.status(400).json({ error: err.message || 'Cannot update status' });
        }
    },

    submitToBod: async (req, res) => {
        try {
            const id = req.params.id;
            const updated = await contractService.updateStatus(id, 'waiting_bod_approval');
            if (!updated) return res.status(404).json({ error: 'Contract not found' });
            return res.json(updated);
        } catch (err) {
            console.error('submitToBod err', err);
            return res.status(400).json({ error: err.message || 'Cannot update status' });
        }
    },

    approveByBod: async (req, res) => {
        try {
            const id = req.params.id;
            const user = req.user || {};
            // only BOD role can approve
            if (!user.role || (user.role !== 'bod' && user.role !== 'admin')) return res.status(403).json({ error: 'Forbidden' });
            const userId = user.id;
            try {
                const updated = await contractService.updateStatus(id, 'approved', userId);
                if (!updated) return res.status(404).json({ error: 'Contract not found' });
                return res.json(updated);
            } catch (err) {
                console.error('approveByBod trigger err', err);
                return res.status(400).json({ error: err.message || 'Cannot approve contract' });
            }
        } catch (err) {
            console.error('approveByBod err', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    sign: async (req, res) => {
        try {
            const id = req.params.id;
            const { signed_file_url } = req.body;
            if (!signed_file_url) return res.status(400).json({ error: 'signed_file_url required' });
            const user = req.user || {};
            // only HR or admin can sign
            if (!user.role || (user.role !== 'hr' && user.role !== 'admin')) return res.status(403).json({ error: 'Forbidden' });
            const updated = await contractService.signContract(id, signed_file_url);
            if (!updated) return res.status(404).json({ error: 'Contract not found' });
            return res.json(updated);
        } catch (err) {
            console.error('sign err', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    // helper endpoint for lead to ack a project (used by tests)
    ackProject: async (req, res) => {
        try {
            const projectId = req.params.id;
            const user = req.user || {};
            if (!user.role || (user.role !== 'lead' && user.role !== 'admin')) return res.status(403).json({ error: 'Forbidden' });
            // update project lead_ack_at
            const result = await contractService.ackProject(projectId, user.id);
            if (!result) return res.status(404).json({ error: 'Project not found' });
            return res.json(result);
        } catch (err) {
            console.error('ackProject err', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    deploy: async (req, res) => {
        try {
            const id = req.params.id;
            const deployed = await contractService.deployContract(id);
            if (!deployed) return res.status(404).json({ error: 'Contract not found' });
            return res.json(deployed);
        } catch (err) {
            console.error('deploy err', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default contractController;