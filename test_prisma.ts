import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'dummy';
const p = new PrismaClient();
console.log(p);
