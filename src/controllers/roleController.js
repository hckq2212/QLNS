import roleService from '../services/roleService.js';

const roleController = {
  getAll: async (req, res) => {
    try {
      const rows = await roleService.getAll();
      console.log('[GET] Lấy danh sách tất cả vai trò thành công');
      return res.json(rows);
    } catch (err) {
      console.error('[GET] Lấy danh sách tất cả vai trò - LỖI:', err.message || err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const id = req.params.id;
      const row = await roleService.getById(id);
      if (!row) return res.status(404).json({ error: 'Role not found' });
      console.log(`[GET] Lấy thông tin vai trò ID ${id} thành công`);
      return res.json(row);
    } catch (err) {
      console.error(`[GET] Lấy thông tin vai trò ID ${id} - LỖI:`, err.message || err);
      return res.status(400).json({ error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const payload = req.body || {};
      const created = await roleService.create(payload);
      console.log('[POST] Tạo vai trò thành công');
      return res.status(201).json(created);
    } catch (err) {
      console.error('[POST] Tạo vai trò - LỖI:', err.message || err);
      return res.status(400).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const id = req.params.id;
      const payload = req.body || {};
      const updated = await roleService.update(id, payload);
      console.log(`[PATCH] Cập nhật vai trò ID ${id} thành công`);
      return res.json(updated);
    } catch (err) {
      console.error(`[PATCH] Cập nhật vai trò ID ${id} - LỖI:`, err.message || err);
      return res.status(400).json({ error: err.message });
    }
  },

  remove: async (req, res) => {
    try {
      const id = req.params.id;
      const removed = await roleService.remove(id);
      console.log(`[DELETE] Xóa vai trò ID ${id} thành công`);
      return res.json({ message: 'Deleted', item: removed });
    } catch (err) {
      console.error(`[DELETE] Xóa vai trò ID ${id} - LỖI:`, err.message || err);
      return res.status(400).json({ error: err.message });
    }
  }
};

export default roleController;
