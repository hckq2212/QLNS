import contracts  from "../models/contracts.js";

const contractService = {
    getAllContracts: async () => {
        try{
            const result = await contracts.getAllContracts();
            return result;
        }catch(err){
           return err;
        }
    },
    getAllPendingContracts: async () =>{
        try{
            const result = await contracts.getAllPendingContracts();
            return result;
        }catch(err){
            return err;
        }
    },
    getContractById: async (id) => {
        try{
            const result = await contracts.getById(id);
            return result;
        }catch(err){
            return err;
        }
    }
}

export default contractService;