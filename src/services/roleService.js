import roles from '../models/roles.js';

const roleService = {
  getAll: async () => {
    return await roles.getAll();
  },

  getById: async (id) => {
    if (!id) throw new Error('id required');
    return await roles.getRoleById(id);
  },

  getByCode: async (code) => {
    if (!code) return null;
    return await roles.getRoleByCode(code);
  },

  create: async (payload) => {
    const { name, code } = payload || {};
    if (!name) throw new Error('name required');
    if (!code) throw new Error('code required');
    return await roles.create(name, code);
  },

  update: async (id, payload) => {
    if (!id) throw new Error('id required');
    const fields = {};
    for (const k of ['name', 'code']) if (Object.prototype.hasOwnProperty.call(payload, k)) fields[k] = payload[k];
    if (Object.keys(fields).length === 0) throw new Error('no fields to update');
    return await roles.update(id, fields);
  },

  remove: async (id) => {
    if (!id) throw new Error('id required');
    return await roles.remove(id);
  }
};

export default roleService;
