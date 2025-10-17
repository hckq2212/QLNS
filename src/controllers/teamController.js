import teamService from "../services/teamService.js";

const teamController = {
    getAll: async (req, res) => {
        try{
            const result = await teamService.getAll();
            return res.json(result)
        }catch(err){
            console.error("Lỗi khi get all Team:", err)
        }
    },
    getById: async (req, res) => {
        try{
            const id = req.params.id;
            const result = await teamService.getById(id);
            return res.json(result)
        }catch(err){
            console.error("Lỗi khi get team by Id: ", err)
        }
    },
    create: async(req, res) => {
        try{
            const body = {
                name: req.body.name,
                description: req.body.description || null,
                lead_user_id: req.body.lead_user_id
            }
            
            const result = await teamService.create(body.name, body.description, body.lead_user_id);
            return res.json(result)
        }catch(err){
            console.error("Lỗi khi tạo team", err)
        }
    }
}
export default teamController