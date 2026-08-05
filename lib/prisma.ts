import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

// On Cloudflare Pages (Edge runtime), WebSocket connections cannot outlive a single request.
// Therefore, we MUST instantiate the Pool and PrismaClient for every request to avoid
// state loss that results in "No database host or connection string was set" errors.

export function getPrisma() {
  const connectionString = 'postgresql://neondb_owner:npg_FE6kSc0gNLqT@ep-dry-tree-azxde4bc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
  
  // Optional: prevent schema parsing errors
  process.env.DATABASE_URL = connectionString;
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter, log: ['warn', 'error'] });
}
