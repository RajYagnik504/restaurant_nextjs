import { fetchLiveOrders } from './actions';
import LiveOrdersClient from './LiveOrdersClient';

export default async function LiveOrdersPage() {
  const initialOrders = await fetchLiveOrders();

  return <LiveOrdersClient initialOrders={initialOrders} />;
}
