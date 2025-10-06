import users from '../models/users.js';
import userSecvice from '../services/authService.js';
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