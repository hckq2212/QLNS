import debtService from "../services/debtService.js";

const debtController = {
    getAll: async (req, res) =>{
        try{
            const result = await debtService.getAll();
            return res.json(result)
        } catch(err) {
            console.error(`Lỗi khi get all công nợ: ${err}`)
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getById: async (req, res) =>{
        try{
            const debtid = req.params.id; 
            const result = await debtService.getById(debtid);
            if (!result) return res.status(404).json({ error: 'Debt not found' });
            return res.json(result)
        } catch(err) {
            console.error(`Lỗi khi get all công nợ: ${err}`)
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    updateStatus: async (req, res) =>{
        try{
            const debtId = req.params.id;
            const debtStatus = req.body.status;
            if (!debtStatus && debtStatus !== false) {
                return res.status(400).json({ error: 'Missing status in request body' });
            }
            const result = await debtService.updateStatus(debtId, debtStatus);
            console.debug('debtController.updateStatus result', result);
            if (!result) return res.status(404).json({ error: 'Debt not found' });
            return res.json(result);
        }catch(err){
            console.error(`Lỗi khi thay đổi trạng thái cho: ${err}`)
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    create: async(req, res) => {
        try{
            const body = {
                contract_id: req.body.contract_id || req.params.contract_id || req.query.contract_id,
                amount: req.body.amount,
                due_date: req.body.due_date || null,
                title: req.body.title || null
            }
            console.log(body)
            const result = await debtService.create(body.contract_id, body.amount, body.due_date, body.title);
            return res.status(201).json(result);
        }catch(err){
            console.error(err)
        }
    },
    createForContract: async(req, res) => {
        try{
            const body = {
                contract_id: req.body.contract_id,
                amount: req.body.amount,
                due_date: req.body.due_date || null,
                title: req.body.title || null
            }
            const contractId = req.params.contract_id || req.query.contract_id
            const result = await debtService.create(body.contract_id, body.amount, body.due_date, body.title);
            return result
        }catch(err){
            console.error(err)
        }
    }
    
}

export default debtController;