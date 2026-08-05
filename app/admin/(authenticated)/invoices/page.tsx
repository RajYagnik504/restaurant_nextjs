import { getPrisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function InvoicesPage() {
  const invoices = await getPrisma().invoice.findMany({
    orderBy: { created_at: 'desc' },
    take: 100, // Limit to recent 100 for performance
  });

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Past Invoices</h2>
        <Link href="/admin/billing" className="btn-primary">Go to Billing</Link>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Order ID</th>
              <th>Date & Time</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice.id}>
                <td><strong>INV-{invoice.id.toString().padStart(4, '0')}</strong></td>
                <td>Order #{invoice.order_id}</td>
                <td>{new Date(invoice.created_at || new Date()).toLocaleString()}</td>
                <td><strong style={{ color: 'var(--success)' }}>₹{invoice.total.toFixed(2)}</strong></td>
                <td><span className="badge badge-success">Paid ({invoice.payment_method})</span></td>
                <td>
                  <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: '0.85rem' }}>
                    View Receipt
                  </button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>No invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
