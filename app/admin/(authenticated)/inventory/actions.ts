'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addRawMaterial(formData: FormData) {
  const name = formData.get('name') as string;
  const unit = formData.get('unit') as string;
  const initialStock = parseFloat(formData.get('initial_stock') as string) || 0;
  const threshold = parseFloat(formData.get('low_stock_threshold') as string) || 10;

  if (!name || !unit) {
    throw new Error('Name and unit are required');
  }

  // Use a transaction to create the material and the initial log
  await prisma.$transaction(async (tx) => {
    const material = await tx.rawMaterial.create({
      data: {
        name,
        unit,
        current_stock: initialStock,
        low_stock_threshold: threshold,
      },
    });

    if (initialStock > 0) {
      await tx.inventoryLog.create({
        data: {
          raw_material_id: material.id,
          type: 'add',
          quantity: initialStock,
          reason: 'Initial stock entry',
        },
      });
    }
  });

  revalidatePath('/admin/inventory');
}

export async function adjustStock(formData: FormData) {
  const materialId = parseInt(formData.get('material_id') as string);
  const type = formData.get('type') as string; // 'add' or 'deduct'
  const quantity = parseFloat(formData.get('quantity') as string) || 0;
  const reason = formData.get('reason') as string || '';

  if (!materialId || quantity <= 0) {
    throw new Error('Invalid input');
  }

  await prisma.$transaction(async (tx) => {
    const material = await tx.rawMaterial.findUnique({
      where: { id: materialId },
    });

    if (!material) throw new Error('Material not found');

    let newStock = material.current_stock ?? 0;
    
    if (type === 'deduct') {
      newStock -= quantity;
      // Cap at 0 to prevent negative stock
      if (newStock < 0) newStock = 0;
    } else if (type === 'add') {
      newStock += quantity;
    }

    await tx.rawMaterial.update({
      where: { id: materialId },
      data: { current_stock: newStock },
    });

    await tx.inventoryLog.create({
      data: {
        raw_material_id: materialId,
        type,
        quantity,
        reason,
      },
    });
  });

  revalidatePath('/admin/inventory');
}
