'use server';

import { getPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function fetchDashboardData() {
  const activeOrders = await getPrisma().order.findMany({
    where: { status: 'served' }, // Only served orders can be settled
    include: {
      table: true,
      items: { include: { menu_item: true } },
    }
  });

  const recentInvoices = await getPrisma().invoice.findMany({
    orderBy: { created_at: 'desc' },
    take: 10,
    include: { order: { include: { table: true } } }
  });
  
  const ledgers = await getPrisma().creditLedger.findMany({
    where: { status: 'outstanding' },
    orderBy: { due_date: 'asc' }
  });

  return { activeOrders, recentInvoices, ledgers };
}

function generateInvoiceNumber() {
  return `INV-${Date.now().toString().slice(-6)}`;
}

export async function settleBill(orderId: number, paymentMethod: string, discount: number = 0, amountPaid: number = 0, redeemedPoints: number = 0) {
  const prisma = getPrisma();
  
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order) throw new Error("Order not found");

  const subtotal = order.items.reduce((acc, item) => acc + (item.price_at_order * item.quantity), 0);
  const total = subtotal - discount; // Post-discount total

  const invoice = await prisma.invoice.create({
    data: {
      order_id: order.id,
      invoice_number: generateInvoiceNumber(),
      subtotal,
      discount,
      total,
      payment_method: paymentMethod,
      customer_paid: amountPaid,
      change_returned: amountPaid > total ? amountPaid - total : 0,
    }
  });

  // CRM Update
  if (order.customer_mobile) {
    const pointsEarned = Math.floor(total / 100); // Loyalty points on POST-DISCOUNT total
    
    await prisma.customerProfile.upsert({
      where: { mobile: order.customer_mobile },
      update: {
        loyalty_points: { increment: pointsEarned - redeemedPoints },
        name: order.customer_name || undefined
      },
      create: {
        mobile: order.customer_mobile,
        name: order.customer_name || 'Customer',
        loyalty_points: pointsEarned
      }
    });
  }

  // Ledger Update
  if (paymentMethod === 'Credit') {
    await prisma.creditLedger.create({
      data: {
        customer_mobile: order.customer_mobile || 'Unknown',
        customer_name: order.customer_name || 'Walk-in',
        invoice_id: invoice.id,
        amount: total,
      }
    });
  }

  // Mark order complete and clear table
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'completed' }
  });
  if (order.table_id) {
    await prisma.table.update({
      where: { id: order.table_id },
      data: { status: 'vacant' }
    });
  }

  revalidatePath('/admin/dashboard');
  return invoice;
}

export async function processRefund(invoiceId: number, amount: number) {
  const prisma = getPrisma();
  
  const refund = await prisma.refund.create({
    data: {
      invoice_id: invoiceId,
      amount,
      reason: 'Customer Request'
    }
  });

  revalidatePath('/admin/dashboard');
  return refund;
}

// Complex Split Portion
export async function splitBillPortion(orderId: number, parts: number) {
  const prisma = getPrisma();
  
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order) throw new Error("Order not found");

  const subtotal = order.items.reduce((acc, item) => acc + (item.price_at_order * item.quantity), 0);
  
  const baseSplit = Math.floor(subtotal / parts);
  const remainder = subtotal - (baseSplit * parts);

  // Generate Invoices
  for (let i = 0; i < parts; i++) {
    let finalSplitTotal = baseSplit;
    if (i === parts - 1) {
      finalSplitTotal += remainder; // Last person pays the remainder
    }
    
    await prisma.invoice.create({
      data: {
        order_id: order.id,
        invoice_number: generateInvoiceNumber(),
        subtotal: finalSplitTotal,
        total: finalSplitTotal,
        payment_method: 'Cash', // Default for split, can be updated later
        split_type: 'portion',
        split_metadata: `Part ${i+1} of ${parts}`
      }
    });
  }

  // Mark order complete
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'completed' }
  });
  if (order.table_id) {
    await prisma.table.update({
      where: { id: order.table_id },
      data: { status: 'vacant' }
    });
  }

  revalidatePath('/admin/dashboard');
}

// Complex Split Items
export async function splitBillItems(orderId: number, itemsToSplit: {id: number, qty: number}[]) {
  const prisma = getPrisma();
  
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order) throw new Error("Order not found");

  let subtotal = 0;
  itemsToSplit.forEach(splitItem => {
    const origItem = order.items.find(i => i.id === splitItem.id);
    if (origItem) {
      subtotal += origItem.price_at_order * splitItem.qty;
    }
  });

  await prisma.invoice.create({
    data: {
      order_id: order.id,
      invoice_number: generateInvoiceNumber(),
      subtotal,
      total: subtotal,
      payment_method: 'Cash',
      split_type: 'items',
      split_metadata: JSON.stringify(itemsToSplit)
    }
  });

  revalidatePath('/admin/dashboard');
}
