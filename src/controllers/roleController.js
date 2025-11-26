import roleService from '../services/roleService.js';

const roleController = {
  getAll: async (req, res) => {
    try {
      const rows = await roleService.getAll();
      return res.json(rows);
    } catch (err) {
      console.error('role.getAll error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const id = req.params.id;
      const row = await roleService.getById(id);
      if (!row) return res.status(404).json({ error: 'Role not found' });
      return res.json(row);
    } catch (err) {
      console.error('role.getById error', err);
      return res.status(400).json({ error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const payload = req.body || {};
      const created = await roleService.create(payload);
      return res.status(201).json(created);
    } catch (err) {
      console.error('role.create error', err);
      return res.status(400).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const id = req.params.id;
      const payload = req.body || {};
      const updated = await roleService.update(id, payload);
      return res.json(updated);
    } catch (err) {
      console.error('role.update error', err);
      return res.status(400).json({ error: err.message });
    }
  },

  remove: async (req, res) => {
    try {
      const id = req.params.id;
      const removed = await roleService.remove(id);
      return res.json({ message: 'Deleted', item: removed });
    } catch (err) {
      console.error('role.remove error', err);
      return res.status(400).json({ error: err.message });
    }
  }
};

export default roleController;
