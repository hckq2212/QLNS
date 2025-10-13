import serviceJobService from '../services/serviceJobService.js'

const serviceJobController = {
    getAll: async (req, res) => {
        try {
            const result = await serviceJobService.getAll();
            return res.json(result);;
        }catch (err){
            console.error(err)
        }
    },
    getById: async (req, res) => {
        const serviceJobId = req.params.id;
        try {
            const result = await serviceJobService.getById(serviceJobId);
            return res.json(result);;
        }catch (err){
            console.error(err)
        }
    },
    getByServiceId: async (req, res) => {
        const serviceId = req.params.id;
        try {
            const result = await serviceJobService.getByServiceId(serviceId);
            return res.json(result);;
        }catch (err){
            console.error(err)
        }
    }
}

export default serviceJobController;