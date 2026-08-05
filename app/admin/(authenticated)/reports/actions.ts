'use server';

import { getPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function fetchDailyReport() {
  const prisma = getPrisma();
  
  // Requirement: Sum from midnight of the current calendar date to now
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); // now

  const invoices = await prisma.invoice.findMany({
    where: {
      created_at: {
        gte: todayStart,
        lte: todayEnd,
      }
    }
  });

  const refunds = await prisma.refund.findMany({
    where: {
      created_at: {
        gte: todayStart,
        lte: todayEnd,
      }
    }
  });

  const totalSales = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalRefunds = refunds.reduce((acc, ref) => acc + ref.amount, 0);
  
  const paymentBreakdown = {
    Cash: invoices.filter(i => i.payment_method === 'Cash').reduce((acc, i) => acc + i.total, 0),
    Card: invoices.filter(i => i.payment_method === 'Card').reduce((acc, i) => acc + i.total, 0),
    UPI: invoices.filter(i => i.payment_method === 'UPI').reduce((acc, i) => acc + i.total, 0),
    Credit: invoices.filter(i => i.payment_method === 'Credit').reduce((acc, i) => acc + i.total, 0),
  };

  return {
    totalSales,
    totalRefunds,
    netSales: totalSales - totalRefunds,
    orderCount: invoices.length,
    paymentBreakdown
  };
}

export async function processDayEnd(expectedCash: number, expectedCard: number, expectedUPI: number) {
  const prisma = getPrisma();
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const invoices = await prisma.invoice.findMany({
    where: {
      created_at: {
        gte: todayStart,
      }
    }
  });

  const totalSales = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalCash = invoices.filter(i => i.payment_method === 'Cash').reduce((acc, i) => acc + i.total, 0);

  // Create DayEndRecord
  const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  
  await prisma.dayEndRecord.create({
    data: {
      date: new Date(),
      closed_by: adminUser?.id || 0, // Fallback if no admin found
      total_sales: totalSales,
      total_orders: invoices.length,
      expected_cash: expectedCash,
      total_tips: 0
    }
  });

  // Create an activity log
  await prisma.activityLog.create({
    data: {
      action: 'DAY_END_CLOSE',
      user_id: adminUser?.id || null,
      details: JSON.stringify({ totalSales, totalCash, expectedCash })
    }
  });

  revalidatePath('/admin/reports');
  return { success: true, totalSales, totalCash, discrepancy: totalCash - expectedCash };
}
