'use server';

import { getPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function placeOrder(orderData: {
  cart: { item: any; qty: number }[];
  customerName?: string;
  customerMobile?: string;
  table?: string;
}) {
  const prisma = getPrisma();

  try {
    // 1. Resolve table if provided
    let tableId: number | null = null;
    let branchId = 1; // Default fallback

    if (orderData.table) {
      const tableRecord = await prisma.table.findFirst({
        where: { name: orderData.table },
        include: { branch: true }
      });
      if (tableRecord) {
        tableId = tableRecord.id;
        branchId = tableRecord.branch_id;
        
        // Mark table as occupied if it was vacant
        if (tableRecord.status === 'vacant') {
          await prisma.table.update({
            where: { id: tableRecord.id },
            data: { 
              status: 'occupied',
              session_start_time: new Date()
            }
          });
        }
      }
    } else {
      // If no table is provided, we need a branch. Let's assume branch 1 for now, or fetch the first one.
      const firstBranch = await prisma.branch.findFirst();
      if (firstBranch) {
        branchId = firstBranch.id;
      }
    }

    // 2. Check if there's an existing open order for this table
    let order: any = null;
    
    if (tableId) {
      order = await prisma.order.findFirst({
        where: {
          table_id: tableId,
          status: { in: ['new', 'preparing', 'served'] }
        },
        orderBy: { created_at: 'desc' }
      });
    }

    let kotNumber = 1;

    // 3. Create or update the order
    if (order) {
      // Existing order found for this table, we will add new items to it (KOT logic)
      
      // Determine the next KOT number
      const existingItems = await prisma.orderItem.findMany({
        where: { order_id: order.id },
        orderBy: { kot_number: 'desc' }
      });
      
      if (existingItems.length > 0 && existingItems[0].kot_number) {
        kotNumber = existingItems[0].kot_number + 1;
      } else {
        kotNumber = 2; // Fallback
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          has_new_items: true,
          status: order.status === 'served' ? 'preparing' : order.status // Revert served to preparing if new items
        }
      });
    } else {
      // No existing open order, create a new one
      order = await prisma.order.create({
        data: {
          branch_id: branchId,
          table_id: tableId,
          type: tableId ? 'dine-in' : 'parcel',
          status: 'new',
          customer_name: orderData.customerName || null,
          customer_mobile: orderData.customerMobile || null,
          has_new_items: false
        }
      });
    }

    // 4. Create Order Items
    const orderItemsToCreate = orderData.cart.map(c => ({
      order_id: order.id,
      menu_item_id: c.item.id,
      quantity: c.qty,
      price_at_order: c.item.price,
      kot_number: kotNumber,
    }));

    await prisma.orderItem.createMany({
      data: orderItemsToCreate
    });

    // 5. Update Customer Profile if mobile is provided
    if (orderData.customerMobile) {
      await prisma.customerProfile.upsert({
        where: { mobile: orderData.customerMobile },
        update: { 
          name: orderData.customerName || undefined
        },
        create: {
          mobile: orderData.customerMobile,
          name: orderData.customerName || null
        }
      });
    }

    revalidatePath('/admin/live_orders');
    return { success: true, orderId: order.id };

  } catch (error: any) {
    console.error("Error placing order:", error);
    return { success: false, error: error.message };
  }
}
