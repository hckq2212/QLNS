import contracts  from "../models/contracts.js";
import customers from "../models/customers.js";
import opportunities from "../models/opportunities.js";

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
    },
    create: async (opportunityId, customerId, totalCost, customerTemp, creatorId ) => {
        try{
            let cid = customerId;
            if (!cid) {
                // create customer from temp info and use its id
                const createdCustomer = await customers.create(customerTemp);
                cid = createdCustomer && createdCustomer.id;
            }

            const result = await contracts.create(opportunityId, cid, totalCost, creatorId);
            return result;
        } catch (err) {
            console.log('contractService.create error:', err);
            throw err;
        }
    }
}

export default contractService;