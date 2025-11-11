import serviceJobs from "../models/serviceJobs.js";

const serviceJobService = {
    getAll: async () => {
        const result = await serviceJobs.getAll();
        return result
    },
    getById: async (serviceJobId) => {
        const result = await serviceJobs.getById(serviceJobId);
        return result
    },
    getByServiceId: async (serviceJobId) => {
        const result = await serviceJobs.getByServiceId(serviceJobId);
        return result
    }
    ,
    create: async (payload = {}) => {
        const data = {
            service_id: payload.service_id ?? payload.serviceId ?? null,
            name: payload.name ?? null,
            description: payload.description ?? null,
            base_cost: payload.base_cost ?? payload.baseCost ?? null,
            owner_type: payload.owner_type,
            partner_id: payload.partner_id ?? null
        };
        const result = await serviceJobs.create(data);
        return result;
    },

    update: async (id, fields = {}) => {
        if (!id) throw new Error('Missing id');
        const allowed = {};
        ['service_id','name','description','base_cost','duration'].forEach(k => {
            if (Object.prototype.hasOwnProperty.call(fields, k) || Object.prototype.hasOwnProperty.call(fields, k.replace('_',''))) {
                allowed[k] = fields[k] ?? fields[k.replace('_','')];
            }
        });
        const result = await serviceJobs.update(id, allowed);
        return result;
    },

    remove: async (id) => {
        if (!id) throw new Error('Missing id');
        const result = await serviceJobs.remove(id);
        return result;
    },
    getServicesForJob: async (serviceJobId) => {
     const result = await serviceJobs.getServicesForJob(serviceJobId)
     return result
    }
}

export default serviceJobService