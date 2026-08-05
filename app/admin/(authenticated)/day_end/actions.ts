'use server';

import { getPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function generateDayEndReport() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const invoices = await getPrisma().invoice.findMany({
    where: {
      created_at: { gte: today },
    },
    include: {
      order: true,
    }
  });

  const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalOrders = invoices.length;

  // Ideally, generate a CSV string here and return it for the client to download.
  let csvContent = "Invoice ID,Order ID,Amount,Payment Method,Date\n";
  for (const inv of invoices) {
    csvContent += `INV-${inv.id},${inv.order_id},${inv.total},${inv.payment_method},${inv.created_at.toISOString()}\n`;
  }
  
  // Note: We're not doing a destructive reset here as the system natively handles daily data by date filtering.
  // In a robust system, you might record a "DayClose" entity in DB.
  
  return {
    totalSales,
    totalOrders,
    csvContent,
  };
}
