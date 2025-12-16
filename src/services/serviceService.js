import services from "../models/services.js";
import serviceJobMapping from "../models/serviceJobMapping.js";

const serviceService = {
    getAll: async () => {
        const result = await services.getAll();
        return result;
    },
     getById: async (serviceId) => {
        const result = await services.getById(serviceId);
        return result;
    }
    ,
    create: async (payload = {}) => {
        // map common aliases
        const data = {
            name: payload.name,
            code: payload.code ?? payload.service_code ?? null,
            price: payload.price ?? payload.cost ?? null,
            description: payload.description ?? null,
            duration: payload.duration ?? payload.default_duration ?? null,
            output_job_id:payload.output_job_id,
        };
        const result = await services.create(data);
        if (result && result.output_job_id) {
            await serviceJobMapping.create({
            service_id: result.id,
            service_job_id: result.output_job_id,
            });
        }


        return result;
    },

    update: async (id, fields = {}) => {
        if (!id) throw new Error('Missing id');
        const allowedFields = {};
        // allow only expected fields
        ['name', 'code', 'price', 'description', 'duration'].forEach(k => {
            if (Object.prototype.hasOwnProperty.call(fields, k)) allowedFields[k] = fields[k];
        });
        const result = await services.update(id, allowedFields);
        return result;
    },

    remove: async (id) => {
        if (!id) throw new Error('Missing id');
        const result = await services.remove(id);
        return result;
    }
}

export default serviceService;