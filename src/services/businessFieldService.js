import businessField from '../models/businessField.js';

const businessFieldService = {
    getAllBusinessFields: async () => {
        return await businessField.getAll();
    },

    getBusinessFieldByCode: async (code) => {
        if (!code) throw new Error('code required');
        return await businessField.getByCode(code);
    },

    createBusinessField: async (payload) => {
        if (!payload.code || !payload.name) {
            throw new Error('code and name are required');
        }
        return await businessField.create(payload);
    },

    updateBusinessField: async (code, fields) => {
        if (!code) throw new Error('code required');
        return await businessField.update(code, fields);
    },

    deleteBusinessField: async (code) => {
        if (!code) throw new Error('code required');
        return await businessField.remove(code);
    }
};

export default businessFieldService;
