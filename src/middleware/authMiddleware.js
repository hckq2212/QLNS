import jwt from 'jsonwebtoken'

function checkToken(req,res, next) {
    const authHeader =  req.headers['authorization'];
    if (!authHeader) return res.status(403).send("Unauthorized");
    const token = authHeader.split(' ')[1];
    if(!token) return res.status(403).send("Unauthorized")
    else{
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY)
            req.user=decoded
            next()

        } catch (error) {
           return res.status(401).send("Invalid or expired token")
        }
    }
}
export default checkToken;