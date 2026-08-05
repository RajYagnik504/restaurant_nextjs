import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("No DATABASE_URL");
  
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
