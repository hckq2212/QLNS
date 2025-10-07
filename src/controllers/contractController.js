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
}

export default contractController;