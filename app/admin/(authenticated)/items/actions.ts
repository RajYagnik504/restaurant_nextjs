'use server';

import { getPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addItem(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const category_id = parseInt(formData.get('category_id') as string);
  const is_veg = formData.get('is_veg') === 'true';

  if (!name || isNaN(price) || isNaN(category_id)) {
    throw new Error('Invalid input');
  }

  await getPrisma().menuItem.create({
    data: { 
      name, 
      description, 
      price, 
      category_id, 
      is_veg,
      is_available: true
    },
  });

  revalidatePath('/admin/items');
}

export async function toggleItemAvailability(id: number, currentStatus: boolean) {
  await getPrisma().menuItem.update({
    where: { id },
    data: { is_available: !currentStatus },
  });
  
  revalidatePath('/admin/items');
}

export async function deleteItem(id: number) {
  await getPrisma().menuItem.delete({
    where: { id },
  });
  
  revalidatePath('/admin/items');
}
