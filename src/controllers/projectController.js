import projectService from '../services/projectService.js'
import contractService from '../services/contractService.js'

const projectController = {
    list: async (req, res) => {
        try {
            const result = await projectService.list();
            console.log('[GET] Lấy danh sách dự án thành công');
            return res.json(result);
        } catch (err) {
            console.error('[GET] Lấy danh sách dự án - LỖI:', err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    getById: async (req, res) => {
        try {
            const id = req.params.id;
            const p = await projectService.getById(id);
            if (!p) return res.status(404).json({ error: 'Project not found' });
            console.log(`[GET] Lấy chi tiết dự án ID ${id} thành công`);
            return res.json(p);
        } catch (err) {
            console.error(`[GET] Lấy chi tiết dự án ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getByContract: async (req, res) =>{
        try{
            const contractId = req.params.contractId;
            const result = await projectService.getByContract(contractId);
            console.log(`[GET] Lấy dự án theo hợp đồng ID ${contractId} thành công`);
            return res.json(result)
        }catch(err){
            console.error(`[GET] Lấy dự án theo hợp đồng ID ${contractId} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    create: async (req, res) => {
        try {
            const body = req.body || {};
            const creatorId = req.user && req.user.id;
            const created = await projectService.createProjectForContract(body.contract_id, body.name, body.description, body.start_date || null, creatorId);
            console.log('[POST] Tạo dự án thành công');
            return res.status(201).json(created);
        } catch (err) {
            console.error('[POST] Tạo dự án - LỖI:', err.message || err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },
    assignTeam: async (req, res) => {
        try{
            const id = req.params.id;
            const teamId = req.body.teamId
            const result = await projectService.assignTeam(id,teamId);
            console.log(`[POST] Gán team cho dự án ID ${id} thành công`);
            return res.json(result)
        }catch(err){
            console.error(`[POST] Gán team cho dự án ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    update: async (req, res) => {
        const id = req.params.id;
        const payload = req.body || {};

        try {
            const result = await projectService.update(id, payload);
            console.log(`[PATCH] Cập nhật dự án ID ${id} thành công`);
            res.status(200).json({ message: 'Cập nhật thành công', project: result });
        } catch (err) {
            console.error(`[PATCH] Cập nhật dự án ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: err.message || 'Server error' });
        }
    },
    getByStatus: async (req, res) => {
        try{
            const status = req.params.status ;
            const result = await projectService.getByStatus(status);
            console.log(`[GET] Lấy dự án theo trạng thái ${status} thành công`);
            return res.json(result)
        }catch(err){
            console.error(`[GET] Lấy dự án theo trạng thái ${status} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },


    close: async (req, res) => {
        try {
            const projectId = req.params.id;
            const updated = await projectService.closeProject(projectId);
            console.log(`[POST] Đóng dự án ID ${projectId} thành công`);
            return res.json(updated);
        } catch (err) {
            console.error(`[POST] Đóng dự án ID ${projectId} - LỖI:`, err.message || err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    }

    ,
    // ack endpoint used by team lead to acknowledge project details
    ack: async (req, res) => {
        try {
            const projectId = req.params.id;
            const user = req.user || {};
            if (!user.id) return res.status(401).json({ error: 'Unauthorized' });
            // delegate to contractService which updates lead_ack_at
            const result = await projectService.ackProject(projectId, user.id);
            if (!result) return res.status(404).json({ error: 'Project not found' });
            console.log(`[POST] Xác nhận dự án ID ${projectId} thành công`);
            return res.json(result);
        } catch (err) {
            console.error(`[POST] Xác nhận dự án ID ${projectId} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
     requestReview: async (req, res) => {
    try {
      const { id } = req.params; 
      const userId = req.user?.id || req.body.user_id; 
      const result = await projectService.requestReview(id, userId);
      console.log(`[POST] Yêu cầu đánh giá dự án ID ${id} thành công`);
      return res.status(201).json(result);
    } catch (err) {
      console.error(`[POST] Yêu cầu đánh giá dự án ID ${id} - LỖI:`, err.message || err);
      return res.status(400).json({ error: err.message });
    }
  }
}

export default projectController;
