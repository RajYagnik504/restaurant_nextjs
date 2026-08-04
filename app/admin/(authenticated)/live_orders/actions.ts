'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function fetchLiveOrders() {
  const activeOrders = await prisma.order.findMany({
    where: {
      status: {
        notIn: ['completed', 'cancelled'],
      }
    },
    include: {
      table: true,
      items: {
        include: {
          menu_item: true,
        }
      }
    },
    orderBy: {
      created_at: 'asc',
    }
  });
  
  return activeOrders;
}

export async function updateOrderStatus(orderId: number, status: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
  
  // If order is completed or cancelled and associated with a table, we don't clear the table here
  // Table session clearance logic happens when Invoice is generated or manually.
  
  revalidatePath('/admin/live_orders');
}
