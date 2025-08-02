# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - Name: `idara-dashboard` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Select the closest region to your users
6. Click "Create new project"

## 2. Get Your Project Credentials

Once your project is created, go to Settings > API:

1. **Project URL**: Copy the URL (looks like `https://your-project-ref.supabase.co`)
2. **API Keys**:
   - `anon` `public` key (for client-side operations)
   - `service_role` `secret` key (for server-side admin operations)

## 3. Update Environment Variables

Update your `.env` file with your Supabase credentials:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

Replace:
- `[YOUR-PASSWORD]` with your database password
- `[YOUR-PROJECT-REF]` with your project reference
- `[YOUR-ANON-KEY]` with your anon public key
- `[YOUR-SERVICE-ROLE-KEY]` with your service role key

## 4. Run Database Migration

After updating your environment variables:

```bash
# Generate Prisma client
npm run db:generate

# Run migrations to create tables in Supabase
npm run db:migrate

# Seed the database with initial data
npm run db:seed
```

## 5. Verify Setup

You can verify your setup by:

1. Checking the Supabase dashboard - you should see your tables under "Table Editor"
2. Running the connection test (we'll create this)

## 6. Enable Row Level Security (RLS)

For production, enable RLS on your tables in Supabase:

1. Go to Authentication > Policies in your Supabase dashboard
2. Enable RLS for each table
3. Create appropriate policies based on your security requirements

## Troubleshooting

- **Connection Issues**: Make sure your DATABASE_URL is correct and includes the password
- **Migration Errors**: Ensure your Supabase project is active and accessible
- **Permission Errors**: Check that you're using the correct API keys for client vs server operations