import customerService from "../services/customerService.js";

const customerController = {
    getAllCustomer : async (req, res) => {
        try{
            const result = await customerService.getAllCustomer();
            return res.json(result);
        }catch(err){
            console.error('getAllCustomer error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}


export default customerController;
