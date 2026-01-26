import serviceService from "../services/serviceService.js";

const serviceController = {
    getAll: async (req, res) => {
        try{
            const result = await serviceService.getAll();
            console.log('[GET] Lấy danh sách tất cả dịch vụ thành công');
            return res.json(result)
        }catch(err){
            console.error('[GET] Lấy danh sách tất cả dịch vụ - LỖI:', err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getById: async (req, res) => {
        try{
            const serviceId = req.params.id
            const result = await serviceService.getById(serviceId);
            if (!result) return res.status(404).json({ error: 'Service not found' });
            console.log(`[GET] Lấy chi tiết dịch vụ ID ${serviceId} thành công`);
            return res.json(result)
        }catch(err){
            console.error(`[GET] Lấy chi tiết dịch vụ ID ${serviceId} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    ,
    create: async (req, res) => {
        try {
            const payload = req.body || {};
            const created = await serviceService.create(payload);
            console.log('[POST] Tạo dịch vụ thành công');
            return res.status(201).json(created);
        } catch (err) {
            console.error('[POST] Tạo dịch vụ - LỖI:', err.message || err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    update: async (req, res) => {
        const id = req.params.id;
        try {
            const updated = await serviceService.update(id, req.body || {});
            if (!updated) return res.status(404).json({ error: 'Service not found or nothing to update' });
            console.log(`[PATCH] Cập nhật dịch vụ ID ${id} thành công`);
            return res.json(updated);
        } catch (err) {
            console.error(`[PATCH] Cập nhật dịch vụ ID ${id} - LỖI:`, err.message || err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    remove: async (req, res) => {
        const id = req.params.id;
        try {
            const removed = await serviceService.remove(id);
            if (!removed) return res.status(404).json({ error: 'Service not found' });
            console.log(`[DELETE] Xóa dịch vụ ID ${id} thành công`);
            return res.json({ success: true, service: removed });
        } catch (err) {
            console.error(`[DELETE] Xóa dịch vụ ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default serviceController;