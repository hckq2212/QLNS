import customerService from "../services/customerService.js";

const customerController = {
    getAllCustomer : async (req, res) => {
        try{
            const result = await customerService.getAllCustomer();
            return res.json(result);
        }catch(err){

        }
    }
}


export default customerController;
