'use server';

import { getPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function fetchInventory() {
  const prisma = getPrisma();
  
  const items = await prisma.rawMaterial.findMany({
    orderBy: { name: 'asc' }
  });

  const logs = await prisma.inventoryLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 30,
    include: { raw_material: true, user: true }
  });

  return { items, logs };
}

export async function addRawMaterial(data: { name: string, unit: string, low_stock_threshold: number }) {
  const prisma = getPrisma();
  
  const item = await prisma.rawMaterial.create({
    data: {
      name: data.name,
      unit: data.unit,
      current_stock: 0,
      low_stock_threshold: data.low_stock_threshold
    }
  });

  revalidatePath('/admin/inventory');
  return { success: true, item };
}

export async function adjustStock(id: number, type: 'ADD' | 'REMOVE', quantity: number, reason: string) {
  const prisma = getPrisma();
  
  const item = await prisma.rawMaterial.findUnique({ where: { id } });
  if (!item) throw new Error("Item not found");

  const newStock = type === 'ADD' ? (item.current_stock || 0) + quantity : (item.current_stock || 0) - quantity;

  await prisma.rawMaterial.update({
    where: { id },
    data: { current_stock: newStock }
  });

  const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  
  await prisma.inventoryLog.create({
    data: {
      raw_material_id: id,
      type,
      quantity,
      reason,
      user_id: adminUser?.id || null // use dynamic admin id
    }
  });

  await prisma.activityLog.create({
    data: {
      action: 'INVENTORY_ADJUSTED',
      user_id: adminUser?.id || null,
      details: JSON.stringify({ itemId: id, type, quantity, reason })
    }
  });

  revalidatePath('/admin/inventory');
  return { success: true };
}
