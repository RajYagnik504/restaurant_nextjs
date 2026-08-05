import { getPrisma } from '@/lib/prisma';
import MenuClient from './MenuClient';

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const table = resolvedParams.table as string | undefined;

  // Fetch all active categories and their active items
  const categories = await getPrisma().category.findMany({
    where: {
      // is_active: true // (assuming is_active is true by default and maybe not exposed in UI yet, we can fetch all or just active)
    },
    orderBy: { sort_order: 'asc' },
    include: {
      items: {
        where: { is_available: true },
        orderBy: { name: 'asc' }
      }
    }
  });

  return (
    <main style={{ paddingBottom: '80px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <header style={{ padding: '15px 20px', backgroundColor: 'var(--primary)', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem' }}>ShivShakti Restaurant</h1>
        {table && <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Table: {table}</div>}
        {!table && <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Parcel / Takeaway</div>}
      </header>
      
      <MenuClient initialCategories={categories} table={table} />
    </main>
  );
}
