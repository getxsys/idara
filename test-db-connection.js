// /test-db-connection.js
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testConnection() {
  let client;
  try {
    console.log('Attempting to connect to the database...');
    client = await pool.connect();
    console.log('✅ Database connection successful!');

    // Run a simple query to check the connection
    const result = await client.query('SELECT NOW()');
    console.log('🕒 Current time from database:', result.rows[0].now);

    // Check for the existence of a key table (e.g., 'users')
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log("✅ 'users' table found.");
    } else {
      console.log("⚠️ 'users' table not found. Make sure migrations have run.");
    }

  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    if (err.code) {
      console.error('   Error Code:', err.code);
    }
    if (err.stack) {
      console.error('   Stack Trace:', err.stack);
    }
  } finally {
    if (client) {
      await client.release();
      console.log('Connection released.');
    }
    await pool.end();
    console.log('Connection pool closed.');
  }
}

testConnection();
