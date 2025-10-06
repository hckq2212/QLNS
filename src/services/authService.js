
import users from '../models/users.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const saltRounds = Number(process.env.SALT_ROUNDS) || 10;

// create tokens for a given user object
function createToken(user){
    const role = user.role
    const payload = { id: user.id, name: user.username, role }
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: '1h'
    })
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET_KEY, {
        expiresIn: '7d'
    })
    return { accessToken, refreshToken }
}

const authService = {
    register: async (userInput) => {
        const existing = await users.getUserByUsername(userInput.username)
        if (existing) {
            return "Tài khoản đã tồn tại"
        }

        try {
            const hashedPassword = await bcrypt.hash(userInput.password, saltRounds);
            const newUser = await users.createUser(userInput.username, hashedPassword, userInput.fullName || userInput.full_name, userInput.role);
            return newUser;
        } catch (err) {
            return err;
        }
    },

    login: async (userInput) => {
        const found = await users.getUserByUsername(userInput.username);
        if (!found) {
            return "Tài khoản không tồn tại"
        }

        const result = await bcrypt.compare(userInput.password, found.password)
        if (!result) {
            return "Mật khẩu không hợp lệ"
        }

        // create tokens and persist refresh token for the user (so we can revoke/rotate later)
        const tokens = createToken(found);
        try {
            await users.updateUserRefreshTokenById(found.id, tokens.refreshToken);
        } catch (err) {
            // if persisting the refresh token fails, still return tokens but log the error
            console.error('Failed to persist refresh token:', err);
        }

        return tokens
    },

    // Refresh tokens: verify incoming refresh token, ensure it matches persisted one,
    // then rotate and return new tokens
    refresh: async (incomingRefreshToken) => {
        try {
            if (!incomingRefreshToken) return { error: 'No refresh token provided' }

            const payload = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET_KEY)

            // find the user and confirm the stored refresh token matches
            const found = await users.getUserById(payload.id)
            if (!found) return { error: 'User not found' }

            if (!found.refresh_token || found.refresh_token !== incomingRefreshToken) {
                return { error: 'Invalid or revoked refresh token' }
            }

            // rotate: issue new pair and persist new refresh token
            const tokens = createToken(found)
            await users.updateUserRefreshTokenById(found.id, tokens.refreshToken)
            return tokens
        } catch (err) {
            // jwt.verify throws on invalid/expired tokens
            return { error: 'Invalid or expired refresh token' }
        }
    },

    changePassword: async (userId, newPassword) => {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            const result = await users.updateUserPasswordById(userId, hashedPassword);
            return result;
        } catch (err) {
            return err
        }
    }
}

export default authService;