'use server';

import { getPrisma } from '@/lib/prisma';

export async function getOrderStatus(orderIdStr: string) {
  const orderId = parseInt(orderIdStr);
  if (isNaN(orderId)) return null;

  const order = await getPrisma().order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { menu_item: true },
        orderBy: { added_at: 'desc' }
      },
      table: true
    }
  });

  return order;
}

export async function submitWaiterCall(orderIdStr: string) {
  const orderId = parseInt(orderIdStr);
  if (isNaN(orderId)) return { success: false, error: 'Invalid ID' };

  try {
    const order = await getPrisma().order.findUnique({
      where: { id: orderId },
      include: { table: true }
    });

    if (!order) return { success: false, error: 'Order not found' };

    await getPrisma().waiterCall.create({
      data: {
        order_id: order.id,
        table_name: order.table?.name || 'Unknown',
        status: 'pending'
      }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function submitFeedback(orderIdStr: string, rating: number, comment: string) {
  const orderId = parseInt(orderIdStr);
  if (isNaN(orderId)) return { success: false, error: 'Invalid ID' };

  try {
    await getPrisma().feedback.create({
      data: {
        order_id: orderId,
        rating,
        comment
      }
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
