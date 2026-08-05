import OrderClient from './OrderClient';
import { getOrderStatus } from './actions';

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const initialOrder = await getOrderStatus(resolvedParams.id);

  if (!initialOrder) {
    return (
      <main style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Order Not Found</h1>
        <p>The order you are looking for does not exist.</p>
      </main>
    );
  }

  return (
    <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ padding: '15px 20px', backgroundColor: 'var(--primary)', color: 'white' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Order #{initialOrder.id}</h1>
        {initialOrder.table && <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Table: {initialOrder.table.name}</div>}
      </header>
      
      <OrderClient orderId={resolvedParams.id} initialOrder={initialOrder} />
    </main>
  );
}
