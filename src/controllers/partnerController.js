import partnerService from '../services/partnerService.js'

const partnerController = {
    getAll: async (req, res) => {
        try {
            const rows = await partnerService.getAll();
            console.log('[GET] Lấy danh sách tất cả đối tác thành công');
            return res.json(rows);
        } catch (err) {
            console.error('[GET] Lấy danh sách tất cả đối tác - LỖI:', err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    getById: async (req, res) => {
        const id = req.params.id;
        try {
            const p = await partnerService.getById(id);
            if (!p) return res.status(404).json({ error: 'Partner not found' });
            console.log(`[GET] Lấy thông tin đối tác ID ${id} thành công`);
            return res.json(p);
        } catch (err) {
            console.error(`[GET] Lấy thông tin đối tác ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    create: async (req, res) => {
        try {
            const payload = req.body || {};
            if (req.user && req.user.id) payload.created_by = payload.created_by || req.user.id;
            const created = await partnerService.create(payload);
            console.log('[POST] Tạo đối tác thành công');
            return res.status(201).json(created);
        } catch (err) {
            console.error('[POST] Tạo đối tác - LỖI:', err.message || err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    update: async (req, res) => {
        const id = req.params.id;
        try {
            const updated = await partnerService.update(id, req.body || {});
            if (!updated) return res.status(404).json({ error: 'Partner not found or nothing to update' });
            console.log(`[PATCH] Cập nhật đối tác ID ${id} thành công`);
            return res.json(updated);
        } catch (err) {
            console.error(`[PATCH] Cập nhật đối tác ID ${id} - LỖI:`, err.message || err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    remove: async (req, res) => {
        const id = req.params.id;
        try {
            const removed = await partnerService.remove(id);
            if (!removed) return res.status(404).json({ error: 'Partner not found' });
            console.log(`[DELETE] Xóa đối tác ID ${id} thành công`);
            return res.json({ success: true, partner: removed });
        } catch (err) {
            console.error(`[DELETE] Xóa đối tác ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default partnerController;
