import users from '../models/users.js';
import authService from '../services/authService.js';
import 'dotenv'



const authController = {
    register: async (req, res) => {
        const userInput = {
            username: req.body.username,
            password: req.body.password,
            full_name: req.body.fullName
        }
        if(!userInput.username || !userInput.password || !userInput.full_name) {
            return res.status(400).json({ error: 'Missing username, password or fullName' });
        }

        try{
            const result = await authService.register(userInput);
            if (typeof result === 'string') {
                // service returned a message (e.g. user exists)
                return res.status(400).json({ error: result });
            }
            return res.status(201).json(result);
        } catch(err){
            console.error('Register error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

    },
    login: async (req, res) =>{
        const userInput = {
            username: req.body.username,
            password: req.body.password
        }
        if(!userInput.password || !userInput.username){
            return res.status(400).json({ error: 'Missing username or password' });
        }

        try{
            const result = await authService.login(userInput)
            if (typeof result === 'string') return res.status(401).json({ error: result });
            return res.json(result)
        }catch(err){
            console.error('Login error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    refresh: async (req, res) => {
        // accept refresh token from body (or cookie) and return new tokens
        const incoming = req.body.refreshToken || req.headers['x-refresh-token']
        try{
            const result = await authService.refresh(incoming)
            if (result && result.error) return res.status(401).send(result.error)
            return res.send(result)
        }catch(err){
            console.error(err)
            return res.status(500).send('Internal error')
        }
    },
    changePassword: async (req,res) => {
        const userId = req.user.id;
        const newPassword = req.body.password;
      
        if (newPassword.trim() === ''){
            res.status(404).send("Vui lòng nhập mật khẩu mới")
        }
        else{ 
            try{
                const result = await authService.changePassword(userId,newPassword);
                res.send(result)
            }catch(err){
                res.send(err)
            }
        }
    }
}
export default authController;