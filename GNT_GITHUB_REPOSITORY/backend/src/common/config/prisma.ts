import { PrismaClient } from '@prisma/client';

// ✅ SINGLETON PATTERN - Global Prisma instance
// Ensures only ONE connection pool for entire application
// Prevents memory leaks and connection exhaustion
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn'] : [],
});

// In development, reuse the prisma instance across hot reloads
if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
