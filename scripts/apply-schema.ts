import { prisma } from '../src/lib/database/connection';
import fs from 'fs';
import path from 'path';

async function applySupabaseSchema() {
  try {
    console.log('Applying Supabase schema to database...');
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'supabase-setup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement + ';');
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (error: any) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('⚠️  Already exists:', statement.substring(0, 50) + '...');
          } else {
            console.error('❌ Error executing:', statement.substring(0, 50) + '...');
            console.error('Error:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Schema application completed!');
    
    // Test the tables
    console.log('\nTesting table access...');
    
    try {
      const userCount = await prisma.$queryRaw`SELECT COUNT(*) FROM users`;
      console.log('✅ Users table accessible');
    } catch (error) {
      console.log('❌ Users table not accessible:', error);
    }
    
    try {
      const clientCount = await prisma.$queryRaw`SELECT COUNT(*) FROM clients`;
      console.log('✅ Clients table accessible');
    } catch (error) {
      console.log('❌ Clients table not accessible:', error);
    }
    
    try {
      const projectCount = await prisma.$queryRaw`SELECT COUNT(*) FROM projects`;
      console.log('✅ Projects table accessible');
    } catch (error) {
      console.log('❌ Projects table not accessible:', error);
    }
    
    try {
      const eventCount = await prisma.$queryRaw`SELECT COUNT(*) FROM calendar_events`;
      console.log('✅ Calendar events table accessible');
    } catch (error) {
      console.log('❌ Calendar events table not accessible:', error);
    }
    
  } catch (error) {
    console.error('❌ Failed to apply schema:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applySupabaseSchema();