import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  try {
    console.log('Checking clients table structure...');
    
    // Get table information
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'clients')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      console.error('Error getting table structure:', error);
      return;
    }

    if (columns.length === 0) {
      console.log('❌ Clients table does not exist');
      return;
    }

    console.log('✅ Clients table structure:');
    console.table(columns);

    // Try to get a sample record to see the actual data structure
    console.log('\nSample record from clients table:');
    const { data: sample, error: sampleError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('Error getting sample record:', sampleError);
    } else if (sample.length > 0) {
      console.log('Sample record:', JSON.stringify(sample[0], null, 2));
    } else {
      console.log('No records in clients table');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTableStructure().then(() => {
  process.exit(0);
});