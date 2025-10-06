import pg from 'pg'
import { Pool } from 'pg';

const db = new Pool ({
  user: "postgres",
  host: "localhost",
  database: "QLNS",
  password: "2212",
  port: 5432,
})
db.connect();

export default db;
