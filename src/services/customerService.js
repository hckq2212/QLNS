import customers from '../models/customers.js'

const customerService = {
    getAllCustomer: async () => {
        return await customers.getAll();
    }
}
export default customerService;
