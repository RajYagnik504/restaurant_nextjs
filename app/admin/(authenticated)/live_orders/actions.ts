'use server';

import { getPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function fetchLiveOrders() {
  const activeOrders = await getPrisma().order.findMany({
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
  await getPrisma().order.update({
    where: { id: orderId },
    data: { 
      status,
      has_new_items: false // Clear the new items flag when status changes
    },
  });
  
  revalidatePath('/admin/live_orders');
}

export async function fetchWaiterCalls() {
  return await getPrisma().waiterCall.findMany({
    where: { status: 'pending' },
    orderBy: { created_at: 'asc' }
  });
}

export async function acknowledgeWaiterCall(id: number) {
  await getPrisma().waiterCall.update({
    where: { id },
    data: { status: 'resolved' }
  });
  revalidatePath('/admin/live_orders');
}
