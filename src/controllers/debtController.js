import debtService from "../services/debtService.js";

const debtController = {
    getAll: async (req, res) =>{
        try{
            const result = await debtService.getAll();
            return res.json(result)
        } catch(err) {
            console.error(`Lỗi khi get all công nợ: ${err}`)
        }
    },
    getById: async (req, res) =>{
        try{
            const debtid = req.params.id; 
            const result = await debtService.getById(debtid);
            return res.json(result)
        } catch(err) {
            console.error(`Lỗi khi get all công nợ: ${err}`)
        }
    }
}

export default debtController;