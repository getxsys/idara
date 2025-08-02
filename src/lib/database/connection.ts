import { PrismaClient } from '../../generated/prisma';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Connection health check for Prisma
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Connection health check for Supabase
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Dynamically import Supabase to avoid issues in test environment
    const { supabase } = await import('../supabase/client');
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}