import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

// On Cloudflare Pages (Edge runtime), WebSocket connections cannot outlive a single request.
// Therefore, we MUST instantiate the Pool and PrismaClient for every request to avoid
// state loss that results in "No database host or connection string was set" errors.

const connectionString = 'postgresql://neondb_owner:npg_FE6kSc0gNLqT@ep-dry-tree-azxde4bc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
process.env.DATABASE_URL = connectionString;

// Initialize ONCE at the module scope for the lifetime of the Cloudflare Worker isolate.
// This prevents Error 1102 (Resource limits exceeded) caused by instantiating 
// multiple WebSockets and Prisma WASM engines during a single request.
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter, log: ['warn', 'error'] });

export function getPrisma() {
  return prisma;
}
