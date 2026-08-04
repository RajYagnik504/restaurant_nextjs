import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  // Fetch high-level stats from Prisma
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalOrders = await prisma.order.count({
    where: {
      created_at: {
        gte: today,
      },
      status: 'completed',
    }
  });

  const totalSales = await prisma.invoice.aggregate({
    _sum: {
      total: true,
    },
    where: {
      created_at: {
        gte: today,
      }
    }
  });

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Today's Orders</div>
          <div className="stat-value">{totalOrders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Today's Sales (₹)</div>
          <div className="stat-value">{totalSales._sum.total || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Active Tables</div>
          <div className="stat-value">0</div>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Dashboard successfully ported to Next.js! 🎉</h3>
        <p>This is a live server-side rendered React component querying Neon Postgres via Prisma.</p>
      </div>
    </div>
  );
}
