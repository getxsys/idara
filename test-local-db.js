import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function testLocalDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Testing local PostgreSQL connection...');
    console.log('Database URL:', process.env.DATABASE_URL);
    
    await client.connect();
    console.log('✅ Connected to local PostgreSQL database!');

    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Current time from database:', result.rows[0].current_time);

    // Check if clients table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'clients'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ Clients table exists');
      
      // Get table structure
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('Clients table structure:');
      console.table(structure.rows);

      // Get sample data
      const sampleData = await client.query('SELECT * FROM clients LIMIT 3');
      console.log(`Found ${sampleData.rows.length} records in clients table`);
      if (sampleData.rows.length > 0) {
        console.log('Sample record:', sampleData.rows[0]);
      }
    } else {
      console.log('❌ Clients table does not exist');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  } finally {
    await client.end();
  }

  return true;
}

testLocalDatabase().then(success => {
  process.exit(success ? 0 : 1);
});