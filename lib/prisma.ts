import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Get the Prisma client singleton instance.
 * This function ensures connection pooling by returning the same instance across all calls.
 *
 * @returns {PrismaClient} The singleton Prisma client instance
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}

export default prisma;
