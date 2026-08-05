import { getPrisma } from '@/lib/prisma';
import CategoriesClient from './CategoriesClient';

export default async function CategoriesPage() {
  const categories = await getPrisma().category.findMany({
    orderBy: { name: 'asc' },
  });

  return <CategoriesClient categories={categories} />;
}
