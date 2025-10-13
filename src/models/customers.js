import db from "../config/db.js";

const customers = {
    async getAll() {
        const result = await db.query('SELECT * FROM customer');
        return result.rows;
    },
    async getById(id){
        const result = await db.query('SELECT * FROM customer WHERE id = $1',[id]);
        return result.rows[0]
    },
    async create(customerOrName, customerPhone = null, customerEmail = null, customerCompany = null, note = null){
        // Accept either an object { name, phone, email, company, note } or individual params
        let name, phone, email, company, n;
        if (customerOrName && typeof customerOrName === 'object') {
            name = customerOrName.name || null;
            phone = customerOrName.phone || null;
            email = customerOrName.email || null;
            company = customerOrName.company || null;
            n = customerOrName.note || null;
        } else {
            name = customerOrName;
            phone = customerPhone;
            email = customerEmail;
            company = customerCompany;
            n = note;
        }

        const result = await db.query(
            'INSERT INTO customer(name, phone, email, company, note) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, phone, email, company, n]
        );
        return result.rows[0];
    }
}

export default customers;