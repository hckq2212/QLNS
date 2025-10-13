import customers from '../models/customers.js'

const customerService = {
    getAllCustomer: async () => {
        return await customers.getAll();
    },
    getById: async (customerId) => {
        return await customers.getById(customerId);
    }
}
export default customerService;
