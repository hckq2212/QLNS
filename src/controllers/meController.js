import meService from "../services/meService.js";

const meController = {
    getMyRole: async(req, res) => {
        try{
            const id = req.user.id
            const result = await meService.getMyRole(id);
            return res.json(result)
        }catch(err){
            console.error(err)
        }
    }
}
export default meController;