const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
});

const query = async (sql, params = []) => {
  let paramIndex = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
  const result = await pool.query(pgSql, params);
  return [result.rows, result];
};

const getConnection = async () => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  client.query = async (sql, params = []) => {
    let paramIndex = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
    const result = await originalQuery(pgSql, params);
    return [result.rows, result];
  };
  client.beginTransaction = () => originalQuery('BEGIN');
  client.commit = () => originalQuery('COMMIT');
  client.rollback = () => originalQuery('ROLLBACK');
  const originalRelease = client.release.bind(client);
  client.release = () => { try { originalRelease(); } catch (e) {} };
  return client;
};

const db = { query, getConnection };
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connexion PostgreSQL (Supabase) établie avec succès');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion PostgreSQL:', error.message);
    return false;
  }
};
module.exports = { pool: db, testConnection };