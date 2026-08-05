import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from './lib/prisma';

async function main() {
  const admin = await prisma.user.upsert({
    where: { mobile: '9999999999' },
    update: {},
    create: {
      mobile: '9999999999',
      name: 'Admin',
      password_hash: 'admin', // the bypass allows admin123
      role: 'admin',
    },
  });
  console.log('Admin user created:', admin);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
