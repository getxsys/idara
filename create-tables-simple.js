import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('Creating basic tables for the application...');
  
  try {
    // First, let's check if we can create a simple table
    console.log('Testing table creation...');
    
    // Create a simple users table first
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        avatar_url TEXT,
        role VARCHAR(50) NOT NULL DEFAULT 'USER',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        mfa_secret TEXT,
        preferences JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Create clients table (compatible with existing structure)
    const createClientsTable = `
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        address TEXT,
        owner_id UUID,
        ai_profile JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Create projects table
    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'PLANNING',
        start_date DATE,
        end_date DATE,
        client_id UUID,
        ai_insights JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Execute table creation using raw SQL through a simple HTTP request
    // Since Supabase doesn't allow direct SQL execution through the client,
    // let's try to create tables by inserting and then handling the error
    
    console.log('Creating users table...');
    try {
      // Try to insert a test record to see if table exists
      const { error: testError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (testError && testError.code === '42P01') {
        console.log('Users table does not exist, it should be created manually in Supabase dashboard');
      } else {
        console.log('✅ Users table exists or is accessible');
      }
    } catch (e) {
      console.log('Users table needs to be created');
    }

    console.log('Checking clients table...');
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .limit(1);
      
      if (error) {
        console.log('❌ Clients table error:', error.message);
      } else {
        console.log('✅ Clients table exists and is accessible');
      }
    } catch (e) {
      console.log('Clients table error:', e.message);
    }

    console.log('Checking projects table...');
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .limit(1);
      
      if (error) {
        console.log('❌ Projects table error:', error.message);
      } else {
        console.log('✅ Projects table exists and is accessible');
      }
    } catch (e) {
      console.log('Projects table error:', e.message);
    }

    // Since we can't create tables directly, let's provide the SQL for manual execution
    console.log('\n=== MANUAL SETUP REQUIRED ===');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('\n-- Create users table');
    console.log(createUsersTable);
    console.log('\n-- Create clients table');
    console.log(createClientsTable);
    console.log('\n-- Create projects table');
    console.log(createProjectsTable);
    
    console.log('\n-- Add foreign key constraints');
    console.log(`
      ALTER TABLE clients 
      ADD CONSTRAINT clients_owner_id_fkey 
      FOREIGN KEY (owner_id) REFERENCES users(id);
      
      ALTER TABLE projects 
      ADD CONSTRAINT projects_client_id_fkey 
      FOREIGN KEY (client_id) REFERENCES clients(id);
    `);

    console.log('\n=== END MANUAL SETUP ===\n');

  } catch (error) {
    console.error('Error in table creation process:', error);
  }
}

createTables().then(() => {
  console.log('Table creation process completed!');
  process.exit(0);
});