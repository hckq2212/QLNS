import services from "../models/services.js";

const serviceService = {
    getAll: async () => {
        const result = await services.getAll();
        return result;
    },
     getById: async (serviceId) => {
        const result = await services.getById(serviceId);
        return result;
    }
}

export default serviceService;