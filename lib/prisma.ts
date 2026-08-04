import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_FE6kSc0gNLqT@ep-dry-tree-azxde4bc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// In Cloudflare Edge, if connectionString is empty, the Neon driver might fallback
// to attempting to connect to localhost, which will hang the worker and cause a 522 Error.
if (!connectionString) {
  console.error("FATAL: DATABASE_URL environment variable is missing.");
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  // Safely inject into process.env so Prisma's schema validator finds it at runtime,
  // using bracket notation to prevent Webpack DefinePlugin from replacing it.
  process.env['DATABASE_URL'] = connectionString;

  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  prisma = new PrismaClient({ adapter, log: ['query'] });
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
}

export { prisma };
