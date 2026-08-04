import { prisma } from '@/lib/prisma';
import ItemsClient from './ItemsClient';

export default async function ItemsPage() {
  const items = await prisma.menuItem.findMany({
    include: {
      category: true,
    },
    orderBy: { name: 'asc' },
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  return <ItemsClient items={items} categories={categories} />;
}
