import users from '../models/users.js';
import userService from '../services/userService.js';
import 'dotenv'



const userContoller = {

    getAllUser: async(req, res) =>{
        try {
            const allUsers = await users.getAll();
            res.json(allUsers);
        } catch (err) {
            res.status(500).send("Error fetching users");
        }
    }
};
export default userContoller;