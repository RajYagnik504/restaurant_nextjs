'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function generateInvoice(orderId: number, discount: number = 0) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { menu_item: true } },
      table: true,
    }
  });

  if (!order) throw new Error('Order not found');
  if (order.status === 'completed') throw new Error('Order is already billed');

  let subtotal = 0;
  for (const item of order.items) {
    subtotal += (item.menu_item?.price || 0) * item.quantity;
  }

  const tax = subtotal * 0.05; // 5% GST example
  const total = subtotal + tax - discount;

  // Use transaction to ensure data integrity
  const invoice = await prisma.$transaction(async (tx) => {
    // 1. Create Invoice
    const newInvoice = await tx.invoice.create({
      data: {
        order_id: order.id,
        subtotal,
        tax,
        discount,
        total,
        payment_method: 'cash', // Default, can be updated later
      }
    });

    // 2. Create Invoice Items
    for (const item of order.items) {
      if (item.menu_item) {
        await tx.invoiceItem.create({
          data: {
            invoice_id: newInvoice.id,
            menu_item_id: item.menu_item.id,
            quantity: item.quantity,
            price: item.menu_item.price,
          }
        });
      }
    }

    // 3. Mark Order as completed
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'completed' },
    });

    // 4. Free up the table if it was a dine-in order
    if (order.table_id) {
      await tx.table.update({
        where: { id: order.table_id },
        data: { status: 'available' },
      });
    }

    return newInvoice;
  });

  revalidatePath('/admin/billing');
  revalidatePath('/admin/live_orders');
  revalidatePath('/admin/tables');
  
  return invoice;
}
