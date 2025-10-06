import db from "../config/db.js"

const opportunities ={
    async getAll(){
        const result = await db.query('SELECT * FROM opportunity');
        return result.rows;
    }
}


export default opportunities