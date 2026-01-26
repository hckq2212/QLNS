import customerService from "../services/customerService.js";

const customerController = {
    getAllCustomer : async (req, res) => {
        try{
            const result = await customerService.getAllCustomer();
            console.log('[GET] Lấy danh sách tất cả khách hàng thành công');
            return res.json(result);
        }catch(err){
            console.error('[GET] Lấy danh sách tất cả khách hàng - LỖI:', err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getById : async (req, res) => {
        const customerId = req.params.id;
        try{
            const result = await customerService.getById(customerId);
            console.log(`[GET] Lấy chi tiết khách hàng ID ${customerId} thành công`);
            return res.json(result);
        }catch(err){
            console.error(`[GET] Lấy chi tiết khách hàng ID ${customerId} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
      update: async (req, res) => {
        const id = req.params.id;
        try {
            const updated = await customerService.updateCustomer(id, req.body || {});
            if (!updated) return res.status(404).json({ error: 'Customer not found or nothing to update' });
            console.log(`[PATCH] Cập nhật khách hàng ID ${id} thành công`);
            return res.json(updated);
        } catch (err) {
            console.error(`[PATCH] Cập nhật khách hàng ID ${id} - LỖI:`, err.message || err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },
    create: async (req, res) => {
        try {
            const payload = req.body || {};
            const created = await customerService.createCustomer(payload);
            console.log('[POST] Tạo khách hàng thành công');
            return res.status(201).json(created);
        } catch (err) {
            console.error('[POST] Tạo khách hàng - LỖI:', err.message || err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },
    removeCustomer: async (req, res) => {
        const id = req.params.id;
        try {
            const removed = await customerService.deleteCustomer(id);
            if (!removed) return res.status(404).json({ error: 'Customer not found' });
            console.log(`[DELETE] Xóa khách hàng ID ${id} thành công`);
            return res.json({ success: true, customer: removed });
        } catch (err) {
            console.error(`[DELETE] Xóa khách hàng ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getAvailableCustomers: async (req, res) => {
        try {
            const user = req.user;
            const customers = await customerService.getAvailableCustomers(user);
            console.log('[GET] Lấy danh sách khách hàng khả dụng thành công');
            res.json(customers);
        } catch (err) {
            console.error('[GET] Lấy danh sách khách hàng khả dụng - LỖI:', err.message || err);
            res.status(400).json({ error: err.message });
        }
}

}


export default customerController;
