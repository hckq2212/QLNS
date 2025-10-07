import contracts  from "../models/contracts.js";

const contractService = {
    getAll: async () => {
        try{
            const result = await contracts.getAllContracts();
            return result;
        }catch(err){
           return err;
        }
    },
    getAllPending: async () =>{
        try{
            const result = await contracts.getAllPendingContracts();
            return result;
        }catch(err){
            return err;
        }
    },
    getById: async (contractId) => {
        try{
            const result = await contracts.getById(contractId);
            return result;
        }catch(err){
            return err;
        }
    }
}

export default contractService;