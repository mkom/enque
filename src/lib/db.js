// lib/db.js
import { Pool } from 'pg';

// Singleton pattern untuk koneksi database
let poolInstance = null;

function getPool() {
  if (!poolInstance) {
    poolInstance = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: 20, // Batas maksimum koneksi
      idleTimeoutMillis: 30000, // Koneksi idle akan ditutup setelah 30 detik
      connectionTimeoutMillis: 2000, // Batas waktu mencoba koneksi
    });

    // Listener untuk error pada pool
    poolInstance.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  return poolInstance;
}

export const pool = getPool();

// Utilitas untuk menjalankan query dalam transaksi
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
