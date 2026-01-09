import { Pool } from 'pg';

const { DB_HOST, DB_USER, DB_PASS, DB_PORT, DB_NAME } = process.env;

const pool = new Pool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    port: parseInt(DB_PORT || '5432'),
    database: DB_NAME,
    ssl: { rejectUnauthorized: false }
});

export default pool;
