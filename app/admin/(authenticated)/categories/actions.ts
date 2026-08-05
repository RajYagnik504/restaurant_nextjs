'use server';

import { getPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  if (!name) throw new Error('Category name is required');

  await getPrisma().category.create({
    data: { name, description },
  });

  revalidatePath('/admin/categories');
}

export async function deleteCategory(id: number) {
  await getPrisma().category.delete({
    where: { id },
  });
  
  revalidatePath('/admin/categories');
}
