import serviceService from "../services/serviceService.js";

const serviceController = {
    getAll: async (req, res) => {
        try{
            const result = await serviceService.getAll();
            return res.json(result)
        }catch(err){
            console.error(`Lỗi khi get all service ${err}`);
        }
    },
    getById: async (req, res) => {
        try{
            const serviceId = req.params.id
            const result = await serviceService.getById(serviceId);
            return res.json(result)
        }catch(err){
            console.error(`Lỗi khi get all service ${err}`);
        }
    }
}

export default serviceController;