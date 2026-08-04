import { prisma } from '@/lib/prisma';
import InventoryClient from './InventoryClient';

export default async function InventoryPage() {
  const materials = await prisma.rawMaterial.findMany({
    orderBy: { name: 'asc' },
  });

  const logs = await prisma.inventoryLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 50,
    include: {
      raw_material: true,
    }
  });

  return <InventoryClient materials={materials} logs={logs} />;
}
