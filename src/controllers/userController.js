import users from '../models/users.js';
import userService from '../services/userService.js';
import 'dotenv'


const userContoller = {

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

};
export default userContoller;