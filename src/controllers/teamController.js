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
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const payload = {};
            if (Object.prototype.hasOwnProperty.call(req.body, 'name')) payload.name = req.body.name;
            if (Object.prototype.hasOwnProperty.call(req.body, 'description')) payload.description = req.body.description;
            if (Object.prototype.hasOwnProperty.call(req.body, 'lead_user_id')) payload.lead_user_id = req.body.lead_user_id;

            const updated = await teamService.update(id, payload);
            if (!updated) return res.status(404).json({ error: 'Team not found or nothing to update' });
            return res.status(200).json(updated);
        } catch (err) {
            console.error('Lỗi khi cập nhật team', err);
            return res.status(500).json({ error: err.message || 'Internal error' });
        }
    },
    getMemberByTeamId: async (req, res) => {
        const id = req.query.id || req.params.id
        try{
            const result = await teamService.getMemberByTeamId(id);
            return res.status(200).json(result)
        }catch(err){
            console.error('Lỗi khi lấy thông tin member: ', err)
        }
    },

}
export default teamController