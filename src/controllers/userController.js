import userService from '../services/userService.js';


const userController = {

    getAllUser: async(req, res) =>{
        try {
            const allUsers = await userService.getAllUsers();
            res.json(allUsers);
        } catch (err) {
            console.error('getAllUser error:', err);
            res.status(500).send("Error fetching users");
        }
    },

    getUserById: async (req, res) => {
        try {
            const id = req.params.id;
            const user = await userService.getUserById(id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            return res.json(user);
        } catch (err) {
            console.error('getUserById error:', err);
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
            return res.json(result);
        } catch(err) {
            console.error('update user error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getPersonalInfo: async(req, res) => {
        const id = req.user.id;
        try{
            const result = await userService.getPersonalInfo(id);
            return res.json(result)
        }catch(err){
            console.error('Lỗi khi lấy thông tin cá nhân', err)
        }
    },
    getJobByUserId : async(req, res) => {
        try{
            const id = req.params.id
            const result = await userService.getJobByUserId(id);
            return res.json(result)
        }catch(err){
            console.error('Lỗi khi lấy thông tin cá nhân', err)
        }
    },

};
export default userController;