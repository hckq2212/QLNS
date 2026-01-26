import debtService from "../services/debtService.js";

const debtController = {
    getAll: async (req, res) =>{
        try{
            const result = await debtService.getAll();
            console.log('[GET] Lấy danh sách tất cả công nợ thành công');
            return res.json(result)
        } catch(err) {
            console.error('[GET] Lấy danh sách tất cả công nợ - LỖI:', err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getById: async (req, res) =>{
        try{
            const debtid = req.params.id; 
            const result = await debtService.getById(debtid);
            if (!result) return res.status(404).json({ error: 'Debt not found' });
            console.log(`[GET] Lấy thông tin công nợ ID ${debtid} thành công`);
            return res.json(result)
        } catch(err) {
            console.error(`[GET] Lấy thông tin công nợ ID ${debtid} - LỖI:`, err.message || err);
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
            console.log(`[PATCH] Cập nhật trạng thái công nợ ID ${debtId} thành công`);
            return res.json(result);
        }catch(err){
            console.error(`[PATCH] Cập nhật trạng thái công nợ ID ${debtId} - LỖI:`, err.message || err);
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
            console.log('[POST] Tạo công nợ thành công');
            return res.status(201).json(result);
        }catch(err){
            console.error('[POST] Tạo công nợ - LỖI:', err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    createForContract: async(req, res) => {
        try{
            const body = {
                amount: req.body.amount,
                due_date: req.body.due_date || null,
                title: req.body.title || null
            }
            const contractId = req.params.contractId || req.query.contractId
            const result = await debtService.create(contractId, body.amount, body.due_date, body.title);
            console.log(`[POST] Tạo công nợ cho hợp đồng ID ${contractId} thành công`);
            return res.json(result)
        }catch(err){
            console.error(`[POST] Tạo công nợ cho hợp đồng ID ${contractId} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    ,
    getByContract: async (req, res) => {
        try {
            const contractId = req.params.contractId || req.query.contractId;
            if (!contractId) return res.status(400).json({ error: 'contractId required' });
            const rows = await debtService.getByContract(contractId);
            console.log(`[GET] Lấy danh sách công nợ theo hợp đồng ID ${contractId} thành công`);
            return res.json(rows);
        } catch (err) {
            console.error(`[GET] Lấy danh sách công nợ theo hợp đồng ID ${contractId} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    
}

export default debtController;