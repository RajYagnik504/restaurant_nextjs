import { getPrisma } from '@/lib/prisma';
import TablesClient from './TablesClient';

export default async function TablesPage() {
  const tables = await getPrisma().table.findMany({
    orderBy: { table_number: 'asc' },
  });

  return <TablesClient tables={tables} />;
}
