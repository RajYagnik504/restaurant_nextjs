import { fetchDashboardData } from './actions';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const data = await fetchDashboardData();
  return <DashboardClient initialData={data} />;
}
