import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for many hosted services like Render/Heroku if you don't have the CA cert
  }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
