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
    }
    ,
    payPartial: async (req, res) => {
        try {
            const debtId = req.params.id;
            const amount = req.body.amount;
            if (!amount && amount !== 0) return res.status(400).json({ error: 'Missing amount in request body' });
            const result = await debtService.payPartial(debtId, amount);
            if (!result) return res.status(404).json({ error: 'Debt not found' });
            return res.json(result);
        } catch (err) {
            console.error('Error in debtController.payPartial', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default debtController;