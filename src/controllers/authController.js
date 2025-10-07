import users from '../models/users.js';
import authService from '../services/authService.js';
import 'dotenv'



const authController = {
    register: async (req, res) => {
        const userInput = {
            username: req.body.username,
            password: req.body.password,
            full_name: req.body.fullName,
            role: req.body.role
        }
        if(!userInput.username || !userInput.password || !userInput.full_name || !userInput.role) {
            return res.status(400).json({ error: 'Thiếu thông tin' });
        }

        try{
            const result = await authService.register(userInput);
            if (typeof result === 'string') {
                // service returned a message (e.g. user exists)
                return res.status(400).json({ error: result });
            }
            // result is the created user row; don't return sensitive fields
            const publicUser = {
                id: result.id,
                username: result.username,
                full_name: result.full_name,
                role: result.role
            };
            return res.status(201).json(publicUser);
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
        // Ensure the request is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = req.user.id;
        const newPassword = req.body && typeof req.body.password === 'string' ? req.body.password.trim() : '';

        if (!newPassword) {
            return res.status(400).json({ error: 'Vui lòng nhập mật khẩu mới' });
        }

        try {
            await authService.changePassword(userId, newPassword);
            return res.json({ message: 'Password updated successfully' });
        } catch (err) {
            console.error('Change password error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
export default authController;