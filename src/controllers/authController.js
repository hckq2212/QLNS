import authService from '../services/authService.js';
import roles from '../models/roles.js';
import 'dotenv'



const authController = {
    register: async (req, res) => {
        // Extract and normalize inputs
        const rawUsername = typeof req.body.username === 'string' ? req.body.username.trim() : '';
        const rawPassword = typeof req.body.password === 'string' ? req.body.password : '';
        const rawFullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : (typeof req.body.full_name === 'string' ? req.body.full_name.trim() : '');
        const rawPhone = typeof req.body.phoneNumber === 'string' ? req.body.phoneNumber.trim() : (typeof req.body.phone === 'string' ? req.body.phone.trim() : '');
        const rawEmail = typeof req.body.email === 'string' ? req.body.email.trim() : '';
        // Resolve role: prefer provided role_id, otherwise fetch default 'staff' role safely
        let rawRole = req.body.role_id;
        if (!rawRole) {
            const defaultRole = await roles.getRoleByCode('staff');
            rawRole = defaultRole && defaultRole.id ? defaultRole.id : null;
        }


        const userInput = {
            username: rawUsername.toLowerCase(),
            password: rawPassword,
            fullName: rawFullName,
            phoneNumber: rawPhone,
            email: rawEmail.toLowerCase(),
            role_id: rawRole
        };

        // Basic validations
        if (!userInput.username || !userInput.password || !userInput.fullName || !userInput.email || !userInput.phoneNumber) {
            return res.status(400).json({ error: 'Thiếu thông tin' });
        }
        if (userInput.username.length < 3) return res.status(400).json({ error: 'username must be at least 3 characters' });
        if (userInput.password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });



        // Validate email if provided
        if (userInput.email) {
            const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRe.test(userInput.email)) return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate phone if provided (basic)
        if (userInput.phoneNumber) {
            const phoneRe = /^[+]?\d[\d\s.-]{4,}$/;
            if (!phoneRe.test(userInput.phoneNumber)) return res.status(400).json({ error: 'Invalid phone number format' });
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
                fullName: result.full_name,
                role: result.role
            };
            console.log(`[POST] Đăng ký tài khoản ${userInput.username} thành công`);
            return res.status(201).json(publicUser);
        } catch(err){
            console.error(`[POST] Đăng ký tài khoản - LỖI:`, err.message || err);
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
            // authService may return a string message for common auth failures
            if (!result) return res.status(401).json({ error: 'Authentication failed' });
            if (typeof result === 'string') return res.status(401).json({ error: result });
            if (result && result.error) return res.status(401).json({ error: result.error });

            // successful login returns token pair
            console.log(`[POST] Đăng nhập tài khoản ${userInput.username} thành công`);
            return res.status(200).json(result)
        }catch(err){
            console.error('[POST] Đăng nhập - LỖI:', err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    refresh: async (req, res) => {
        // accept refresh token from body (or cookie) and return new tokens
        const incoming = req.body.refreshToken || req.headers['x-refresh-token']
        try{
            const result = await authService.refresh(incoming)
            if (result && result.error) return res.status(401).send(result.error)
            console.log('[POST] Làm mới token thành công');
            return res.send(result)
        }catch(err){
            console.error('[POST] Làm mới token - LỖI:', err.message || err);
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
            console.log(`[POST] Đổi mật khẩu cho người dùng ID ${userId} thành công`);
            return res.json({ message: 'Password updated successfully' });
        } catch (err) {
            console.error(`[POST] Đổi mật khẩu cho người dùng ID ${userId} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
export default authController;