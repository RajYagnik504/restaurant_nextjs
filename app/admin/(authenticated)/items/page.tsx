import { getPrisma } from '@/lib/prisma';
import ItemsClient from './ItemsClient';

export default async function ItemsPage() {
  const items = await getPrisma().menuItem.findMany({
    include: {
      category: true,
    },
    orderBy: { name: 'asc' },
  });

  const categories = await getPrisma().category.findMany({
    orderBy: { name: 'asc' },
  });

  return <ItemsClient items={items} categories={categories} />;
}
