'use server';

import { getPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addTable(formData: FormData) {
  const table_number = parseInt(formData.get('table_number') as string);
  const seats = parseInt(formData.get('seats') as string) || 4;
  const status = formData.get('status') as string || 'available';

  if (isNaN(table_number)) throw new Error('Table number is required');

  await getPrisma().table.create({
    data: { table_number, seats, status },
  });

  revalidatePath('/admin/tables');
}

export async function deleteTable(id: number) {
  await getPrisma().table.delete({
    where: { id },
  });
  
  revalidatePath('/admin/tables');
}
