import { getPrisma } from '@/lib/prisma';
import BillingClient from './BillingClient';

export default async function BillingPage() {
  const activeOrders = await getPrisma().order.findMany({
    where: {
      status: { not: 'completed' }, // Typically we bill orders that are 'served' or 'received', but not completed.
    },
    include: {
      items: { include: { menu_item: true } },
      table: true,
    },
    orderBy: { created_at: 'asc' },
  });

  return <BillingClient orders={activeOrders} />;
}
