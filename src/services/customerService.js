import customers from '../models/customers.js'

const customerService = {
    getAllCustomer: async () => {
        return await customers.getAll();
    },
    getById: async (customerId) => {
        return await customers.getById(customerId);
    },
    updateCustomer: async (id, fields = {}) => {
        if (!id) throw new Error('Missing id');
        return await customers.update(id, fields);
    },
     createCustomer: async (payload = {}) => {
        if (!payload || !payload.name) throw new Error('Tên khách hàng là bắt buộc');
        // Map possible aliases if needed (short names from client)
        const data = {
            name: payload.name,
            phone: payload.phone ?? payload.phone_number ?? null,
            email: payload.email ?? null,
            company: payload.company ?? null,
            address: payload.address ?? null,
            note: payload.note ?? null,
            identity_code: payload.identity_code ?? payload.identityCode ?? null,
            status: payload.status ?? 'potential'
        };
        return await customers.create(data);
    },
    deleteCustomer: async (id) => {
        if (!id) throw new Error('Missing id');
        return await customers.remove(id);
    }
}
export default customerService;
