import { getPrisma } from '@/lib/prisma';
import InventoryClient from './InventoryClient';

export default async function InventoryPage() {
  const materials = await getPrisma().rawMaterial.findMany({
    orderBy: { name: 'asc' },
  });

  const logs = await getPrisma().inventoryLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 50,
    include: {
      raw_material: true,
    }
  });

  return <InventoryClient materials={materials} logs={logs} />;
}
