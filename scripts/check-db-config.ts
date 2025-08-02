// /scripts/check-db-config.ts
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

function checkDbConfig() {
  console.log('Checking database configuration...');

  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  let isSuccess = true;

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      console.error(`❌ Missing required environment variable: ${varName}`);
      isSuccess = false;
    } else {
      // Mask sensitive parts of the keys for security
      const value = process.env[varName]!;
      const maskedValue = varName.includes('_KEY') 
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : value;
      console.log(`✅ ${varName} is set: ${maskedValue}`);
    }
  }

  if (isSuccess) {
    console.log('\n🎉 All database environment variables are configured correctly!');
  } else {
    console.error('\n⚠️ Please set the missing environment variables in your .env file.');
    console.log('   Review the Supabase setup instructions for more details.');
    process.exit(1); // Exit with error
  }
}

checkDbConfig();
