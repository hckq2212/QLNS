import jwt from 'jsonwebtoken'
import users from '../models/users.js'


async function checkToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ status: 401, error: 'Unauthorized: No token provided' });
        }

        const token = authHeader.slice(7).trim(); // remove 'Bearer '
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
        } catch (err) {
            return res.status(401).json({ status: 401, error: 'Unauthorized: Invalid or expired token' });
        }

        // `decoded` is expected to contain an identifier for the user. authService sets `id`.
        const userId = decoded.id || decoded._id ;
        if (!userId) {
            return res.status(401).json({ status: 401, error: 'Unauthorized: Token missing user id' });
        }

        // load user from DB and ensure active
        const user = await users.getUserById(userId);
        if (!user) {
            return res.status(401).json({ status: 401, error: 'Unauthorized: User not found' });
        }

        // adapt to your users table: we expect a `status` column (e.g. 'active') or similar
        if (user.status !== undefined) {
            // treat falsy or explicit 'inactive'/'disabled' as not allowed
            if (user.status === 'inactive' || user.status === 'disabled' || !user.status) {
                return res.status(401).json({ status: 401, error: 'Unauthorized: User inactive' });
            }
        }

        // Optional: check source (user-agent) if token contains `source` claim
        if (decoded.source) {
            const source = req.headers['user-agent'] || req.headers['User-Agent'];
            if (!source || source !== decoded.source) {
                console.log('source mismatch', source, decoded.source);
                return res.status(401).json({ status: 401, error: 'Unauthorized: Invalid source' });
            }
        }

        // attach minimal user info to request for downstream handlers
        req.user = {
            id: user.id,
            username: user.username,
            role: user.role,
        };
        req.userId = user.id;

        next();
    } catch (error) {
        console.error('Authentication Error:', error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
}

export default checkToken;