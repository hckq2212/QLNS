import userService from '../services/userService.js';


const userController = {

    getAllUser: async(req, res) =>{
        try {
            const allUsers = await userService.getAllUsers();
            console.log('[GET] Lấy danh sách tất cả người dùng thành công');
            res.json(allUsers);
        } catch (err) {
            console.error('[GET] Lấy danh sách tất cả người dùng - LỖI:', err.message || err);
            res.status(500).send("Error fetching users");
        }
    },

    getUserById: async (req, res) => {
        try {
            const id = req.params.id;
            const user = await userService.getUserById(id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            console.log(`[GET] Lấy thông tin người dùng ID ${id} thành công`);
            return res.json(user);
        } catch (err) {
            console.error(`[GET] Lấy thông tin người dùng ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    update: async (req, res) =>{
        const userId = req.params.id;
        const requesterId = req.user && req.user.id;
        const requesterRole = req.user && req.user.role;

        // allow if requester is 'bod' (admin) or updating their own record
        // ensure numeric comparison for ids when possible
        const numericUserId = Number(userId);
        const isSelf = requesterId !== undefined && Number(requesterId) === numericUserId;
        const isAdmin = requesterRole === 'bod';
        if (!isAdmin && !isSelf) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        try {
            const {
                username,
                fullName,
                phoneNumber,
                email
            } = req.body;
            const result = await userService.update(userId, username, fullName, phoneNumber, email)
            if (!result) return res.status(404).json({ error: 'User not found or no fields to update' });
            console.log(`[PATCH] Cập nhật người dùng ID ${userId} thành công`);
            return res.json(result);
        } catch(err) {
            console.error(`[PATCH] Cập nhật người dùng ID ${userId} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getPersonalInfo: async(req, res) => {
        const id = req.user.id;
        try{
            const result = await userService.getPersonalInfo(id);
            console.log(`[GET] Lấy thông tin cá nhân thành công`);
            return res.json(result)
        }catch(err){
            console.error('[GET] Lấy thông tin cá nhân - LỖI:', err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getJobByUserId : async(req, res) => {
        try{
            const id = req.params.id
            const result = await userService.getJobByUserId(id);
            console.log(`[GET] Lấy danh sách công việc của người dùng ID ${id} thành công`);
            return res.json(result)
        }catch(err){
            console.error(`[GET] Lấy danh sách công việc của người dùng ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

};
export default userController;