import contractService from "../services/contractService.js";


const contractController = {
    getAll: async (req, res) => {
        try {
            const result = await contractService.getAll();
            return res.json(result);
        }catch(err){

        }
    },
    getAllPending: async (req, res) => {
        try {
            const result = await contractService.getAllPending();
            return res.json(result);
        }catch(err){

        }
    },
    getById: async (req, res) => {
        const contractId =  req.params.id;

        try{   
            const result = await contractService.getById(contractId);
            return res.json(result);
        }catch(err){
            
        }
    }
}

export default contractController;