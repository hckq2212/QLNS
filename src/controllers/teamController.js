import teamService from "../services/teamService.js";

const teamController = {
    getAll: async (req, res) => {
        try{
            const result = await teamService.getAll();
            console.log('[GET] Lấy danh sách tất cả team thành công');
            return res.json(result)
        }catch(err){
            console.error('[GET] Lấy danh sách tất cả team - LỖI:', err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getById: async (req, res) => {
        try{
            const id = req.params.id;
            const result = await teamService.getById(id);
            console.log(`[GET] Lấy thông tin team ID ${id} thành công`);
            return res.json(result)
        }catch(err){
            console.error(`[GET] Lấy thông tin team ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
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
            console.log('[POST] Tạo team thành công');
            return res.json(result)
        }catch(err){
            console.error('[POST] Tạo team - LỖI:', err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
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
            console.log(`[PATCH] Cập nhật team ID ${id} thành công`);
            return res.status(200).json(updated);
        } catch (err) {
            console.error(`[PATCH] Cập nhật team ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: err.message || 'Internal error' });
        }
    },
    getMemberByTeamId: async (req, res) => {
        const id = req.query.id || req.params.id
        try{
            const result = await teamService.getMemberByTeamId(id);
            console.log(`[GET] Lấy danh sách thành viên team ID ${id} thành công`);
            return res.status(200).json(result)
        }catch(err){
            console.error(`[GET] Lấy danh sách thành viên team ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

}
export default teamController