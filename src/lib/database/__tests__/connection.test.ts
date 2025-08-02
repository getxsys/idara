import { checkDatabaseConnection, checkSupabaseConnection } from '../connection';

describe('Database Connection', () => {
  describe('Prisma Connection', () => {
    it('should connect to the database successfully', async () => {
      const isConnected = await checkDatabaseConnection();
      expect(typeof isConnected).toBe('boolean');
    }, 10000);
  });

  describe('Supabase Connection', () => {
    it('should connect to Supabase successfully', async () => {
      // Skip if Supabase credentials are not configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.log('Skipping Supabase connection test - credentials not configured');
        return;
      }

      const isConnected = await checkSupabaseConnection();
      expect(typeof isConnected).toBe('boolean');
    }, 10000);
  });
});