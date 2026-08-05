import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function main() {
  const connectionString = 'postgresql://neondb_owner:npg_FE6kSc0gNLqT@ep-dry-tree-azxde4bc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  const prisma = new PrismaClient({ adapter });

  const admin = await prisma.user.upsert({
    where: { mobile: '9999999999' },
    update: {},
    create: {
      mobile: '9999999999',
      name: 'Admin',
      password_hash: 'admin',
      role: 'admin',
    },
  });
  console.log('Admin user created:', admin);
}

main().catch(console.error);
