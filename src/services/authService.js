
import users from '../models/users.js'
import bcrypt, { hash, compare } from 'bcrypt'
import jwt from 'jsonwebtoken'


const saltRounds = Number(process.env.SALT_ROUNDS) || 10; 

const authService= {
    register: async (userInput)=>{
    
        const user = await users.getUserByUsername(userInput.username)
        if(user){
            return "Tài khoản đã tồn tại"
        } try {
            const hashedPassword = await bcrypt.hash(userInput.password, saltRounds);
            const newUser = await users.createUser(userInput.username, hashedPassword);
            return newUser;
        } catch (err) {
            return err;
        }
    },
    login: async (userInput) =>{
        const user = await users.getUserByUsername(userInput.username)
        function createToken(){
           const accessToken = jwt.sign({id:user.id, name: user.username}, process.env.ACCESS_TOKEN_SECRET_KEY,{
            expiresIn:'5m'
           })
           const refreshToken = jwt.sign({id:user.id, name: user.username}, process.env.REFRESH_TOKEN_SECRET_KEY,{
            expiresIn:'10m'
           })
           return { accessToken, refreshToken }
        }
        if(!user){
            return "Account not existed"
        }else{
            const result = await bcrypt.compare(userInput.password, user.password)
            if(!result){
                return "Invalid password"
            }else{
                const tokens = createToken();
                return tokens
            }
        }
    },
    changePassword:async (userId, newPassword) => {
        try{
           const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
           const result = await users.updateUserPasswordById(userId, hashedPassword);
           return result;
        }catch(err){
            res.send(err)
        }
    }
}
export default authService;