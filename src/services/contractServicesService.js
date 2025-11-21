import contractServices from '../models/contractServices.js';

const contractServicesService = {
    getAll: async () => {
        return await contractServices.getAll();
    },

    getById: async (id) => {
        if (!id) throw new Error('id required');
        return await contractServices.getById(id);
    },

    getByContract: async (contractId) => {
        if (!contractId) throw new Error('contractId required');
        return await contractServices.getByContract(contractId);
    },

    create: async (payload, createdBy = null) => {
        const { contract_id, service_id = null, service_job_id = null, qty = 1, sale_price = 0, cost_price = 0 } = payload || {};
        if (!contract_id) throw new Error('contract_id is required');

        const qtyN = Number(qty) || 1;
        const saleN = sale_price != null ? Number(sale_price) : 0;
        const costN = cost_price != null ? Number(cost_price) : 0;

        return await contractServices.create(contract_id, service_id, service_job_id, qtyN, saleN, costN, createdBy);
    },

    update: async (id, payload) => {
        if (!id) throw new Error('id required');
        const allowed = {};
        // pass through fields: service_id, service_job_id, qty, sale_price, cost_price, result
        const fields = {};
        for (const k of ['service_id','service_job_id','qty','sale_price','cost_price','result']) {
            if (Object.prototype.hasOwnProperty.call(payload, k)) fields[k] = payload[k];
        }
        if (Object.keys(fields).length === 0) throw new Error('No updatable fields provided');
        return await contractServices.update(id, fields);
    },

    remove: async (id) => {
        if (!id) throw new Error('id required');
        return await contractServices.remove(id);
    }
};

export default contractServicesService;
