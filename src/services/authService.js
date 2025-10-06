
import users from '../models/users.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const saltRounds = Number(process.env.SALT_ROUNDS) || 10;

// create tokens for a given user object
function createToken(user){
    const role = user.role || 'user'
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
        const user = await users.getUserByUsername(userInput.username)
        if (user) {
            return "Tài khoản đã tồn tại"
        }

        try {
            const hashedPassword = await bcrypt.hash(userInput.password, saltRounds);
            const newUser = await users.createUser(userInput.username, hashedPassword);
            return newUser;
        } catch (err) {
            return err;
        }
    },

    login: async (userInput) => {
        const user = await users.getUserByUsername(userInput.username);
        if (!user) {
            return "Account not existed"
        }

        const result = await bcrypt.compare(userInput.password, user.password)
        if (!result) {
            return "Invalid password"
        }

        // create tokens and persist refresh token for the user (so we can revoke/rotate later)
        const tokens = createToken(user);
        try {
            await users.updateUserRefreshTokenById(user.id, tokens.refreshToken);
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
            const user = await users.getUserById(payload.id)
            if (!user) return { error: 'User not found' }

            if (!user.refresh_token || user.refresh_token !== incomingRefreshToken) {
                return { error: 'Invalid or revoked refresh token' }
            }

            // rotate: issue new pair and persist new refresh token
            const tokens = createToken(user)
            await users.updateUserRefreshTokenById(user.id, tokens.refreshToken)
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