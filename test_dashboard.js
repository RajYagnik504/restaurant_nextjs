const { PrismaClient } = require('@prisma/client');
const { Pool } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');

const config = { connectionString: 'postgresql://neondb_owner:npg_FE6kSc0gNLqT@ep-dry-tree-azxde4bc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' };

function getPrisma() {
  const adapter = new PrismaNeon(config);
  return new PrismaClient({ adapter, log: ['warn', 'error'] });
}

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log("Fetching orders...");
  const totalOrders = await getPrisma().order.count({
    where: {
      created_at: {
        gte: today,
      },
      status: 'completed',
    }
  });
  console.log("Total orders:", totalOrders);

  console.log("Fetching sales...");
  const totalSales = await getPrisma().invoice.aggregate({
    _sum: {
      total: true,
    },
    where: {
      created_at: {
        gte: today,
      }
    }
  });
  console.log("Total sales:", totalSales);
}

main().catch(console.error);
