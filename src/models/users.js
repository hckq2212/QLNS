import db from "../config/db.js" 

const users = {
    async getAll(){
        const result = await db.query("SELECT * FROM users")
        return result.rows;
    },
    async getUserByUsername (username) {
        const result = await db.query("SELECT * FROM users WHERE username = $1",[username]);
        return result.rows[0];
    },
    async createUser(username, password){
        const result = await db.query("INSERT INTO users(username, password) VALUES($1, $2)",[username,password])
        return result.rows[0];
    },
    async getUserById (id){
        const result = await db.query(
            "SELECT * FROM users WHERE id = $1",
            [id]
        );
        return result.rows[0]
    },
    async updateUserPasswordById(id, password){
        const result = await db.query(
            "UPDATE users SET password = $1 WHERE id = $2 RETURNING *",
            [password, id]
        )
        return result.rows[0]
    }
};

export default users;