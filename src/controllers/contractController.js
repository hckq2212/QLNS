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
    createFromOpportunity: async (req, res) => {
        if (!req.user?.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const creatorId = req.user.id;
        const opportunityId = req.params?.opportunityId;

        // destructuring an toàn: nếu req.body undefined -> dùng {}
        const {
            customerId = null,
            totalCost,
            totalRevenue,
            customer_temp: customerTemp,
        } = req.body ?? {};

        const body = { totalCost, totalRevenue, customerTemp };

        try {
            const result = await contractService.createFromOpportunity(
            opportunityId,
            customerId,
            body.totalCost,
            body.totalRevenue,
            body.customerTemp,
            creatorId
            );
            return res.status(201).json(result);
        } catch (err) {
            console.error('create contract error:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    approveByBod: async (req, res) => {
        const approverId = req.user.id;
        const id = req.params.id;
        const status = "bod_approved"
        try{
            const result = await contractService.updateStatus(status, approverId, id)
            if(result){
                return res.status(200).send("Đã duyệt")
            }
        }catch(err){
            console.error(err)
        }
    },
    uploadProposalContract: async (req, res) => {
        const proposalContractURL = req.body.proposalContract;
        const id = req.params.id
        try {
            const result = await contractService.uploadProposalContract(proposalContractURL, id);
            if (result){
                return res.status(200).send("Upload thành công")
            }
        } catch (error) {
            console.error(error)
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
    hrConfirm: async (req, res) => {
        const approverId = req.user.id;
        const id = req.params.id;
        const status = "hr_approved"
        try{
            const result = await contractService.updateStatus(status, approverId, id)
        }catch(err){
            console.error(err)
        }
    },
    getServices: async (req, res) => {
        try {
            const contractId = req.params.id;
            const rows = await contractService.getServicesByContractId(contractId);
            return res.json(rows);
        } catch (err) {
            console.error('getServices err', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getByStatus : async (req, res) => {
        try{
            const status =  req.query.status || req.params.status ;
            const result = await contractService.getByStatus(status);
            return res.json(result)
        }catch(err){
            console.error('Lỗi khi get bởi status')
        }
    }
    
}

export default contractController;