/**
 * Configuration de la connexion PostgreSQL (Supabase)
 * Utilise pg avec pool de connexions
 * 
 * Wrapper de compatibilité : expose la même API que l'ancien mysql2
 * pour que tous les contrôleurs fonctionnent sans modification majeure
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
});

/**
 * Wrapper pour compatibilité avec la syntaxe mysql2
 * mysql2 : const [rows] = await pool.query(sql, params)
 * pg     : const { rows } = await pool.query(sql, params)
 * 
 * Ce wrapper convertit les ? en $1, $2... et retourne [rows]
 */
const query = async (sql, params = []) => {
  let paramIndex = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);

  const result = await pool.query(pgSql, params);
  return [result.rows, result];
};

/**
 * Obtenir une connexion du pool (pour les transactions)
 */
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
  client.release = () => {
    try {
      originalRelease();
    } catch (e) {}
  };

  return client;
};

/**
 * Pool compatible mysql2
 */
const db = {
  query,
  getConnection,
};

/**
 * Teste la connexion
 */
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
