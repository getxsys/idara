import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testClientsTable() {
  try {
    console.log('Testing clients table...');
    
    // Test if clients table exists and is accessible
    const { data, error } = await supabase
      .from('clients')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Clients table error:', error);
      return false;
    }

    console.log('✅ Clients table exists and is accessible');
    
    // Try to fetch existing clients
    const { data: clients, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .limit(5);

    if (fetchError) {
      console.error('❌ Error fetching clients:', fetchError);
      return false;
    }

    console.log(`📊 Found ${clients.length} existing clients`);
    if (clients.length > 0) {
      console.log('Sample client:', clients[0]);
    }

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testClientsTable().then(success => {
  process.exit(success ? 0 : 1);
});