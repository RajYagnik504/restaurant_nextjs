'use server';

import { getPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function fetchStaffAndLogs() {
  const prisma = getPrisma();
  
  const staff = await prisma.user.findMany({
    orderBy: { id: 'desc' }
  });

  const logs = await prisma.activityLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 50
  });

  return { staff, logs };
}

export async function addStaffMember(data: any) {
  const prisma = getPrisma();
  
  const password_hash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      mobile: data.mobile,
      password_hash,
      role: data.role,
      branch_id: 1 // Default branch for demo
    }
  });

  revalidatePath('/admin/staff');
  return { success: true, user };
}

export async function deleteStaffMember(id: number) {
  const prisma = getPrisma();
  
  await prisma.user.delete({
    where: { id }
  });

  revalidatePath('/admin/staff');
  return { success: true };
}
