import partners from '../models/partners.js';

const partnerService = {
    getAll: async () => {
        return await partners.getAll();
    },

    getById: async (id) => {
        if (!id) return null;
        return await partners.getById(id);
    },

    create: async (payload = {}) => {
        if (!payload || !payload.name) throw new Error('Partner name is required');
        const data = {
            name: payload.name,
            phone: payload.phone ?? payload.phone_number ?? null,
            email: payload.email ?? null,
            company: payload.company ?? null,
            address: payload.address ?? null,
            note: payload.note ?? null,
            status: payload.status ?? 'active',
            created_by: payload.created_by ?? payload.createdBy ?? null
        };
        return await partners.create(data);
    },

    update: async (id, fields = {}) => {
        if (!id) throw new Error('Missing id');
        return await partners.update(id, fields);
    },

    remove: async (id) => {
        if (!id) throw new Error('Missing id');
        return await partners.remove(id);
    }
};

export default partnerService;
