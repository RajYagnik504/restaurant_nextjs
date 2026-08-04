'use client';

import { useState } from 'react';
import { generateInvoice } from './actions';
import { useRouter } from 'next/navigation';

export default function BillingClient({ orders }: { orders: any[] }) {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleGenerateInvoice = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      await generateInvoice(selectedOrder.id, discount);
      alert('Invoice generated successfully!');
      setSelectedOrder(null);
      setDiscount(0);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = (order: any) => {
    return order.items.reduce((sum: number, item: any) => sum + ((item.menu_item?.price || 0) * item.quantity), 0);
  };

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      <div className="card" style={{ flex: '1 1 300px' }}>
        <div className="card-header">
          <h2>Active Orders Ready for Billing</h2>
        </div>
        <div className="orders-list">
          {orders.map(order => (
            <div 
              key={order.id} 
              style={{ 
                padding: '15px', 
                borderBottom: '1px solid var(--border-color)', 
                cursor: 'pointer',
                background: selectedOrder?.id === order.id ? 'var(--bg-color)' : 'transparent',
                borderLeft: selectedOrder?.id === order.id ? '4px solid var(--primary)' : 'none'
              }}
              onClick={() => setSelectedOrder(order)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Order #{order.id}</strong>
                <span className="badge badge-success">{order.status}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                {order.order_type === 'parcel' ? 'Parcel' : `Table ${order.table?.table_number}`} • {order.items.length} items
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No active orders to bill.
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ flex: '2 1 400px' }}>
        <div className="card-header">
          <h2>Billing Summary</h2>
        </div>
        {selectedOrder ? (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Order #{selectedOrder.id} ({selectedOrder.order_type})</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                {new Date(selectedOrder.created_at).toLocaleString()}
              </p>
            </div>

            <table className="data-table" style={{ marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.menu_item?.name || 'Unknown'}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.menu_item?.price || 0}</td>
                    <td>₹{(item.menu_item?.price || 0) * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '15px', paddingRight: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Subtotal:</span>
                <span>₹{calculateSubtotal(selectedOrder).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Tax (5% GST):</span>
                <span>₹{(calculateSubtotal(selectedOrder) * 0.05).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                <span>Discount (₹):</span>
                <input 
                  type="number" 
                  style={{ width: '100px', padding: '5px' }} 
                  value={discount} 
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
                  min="0" 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                <span>Grand Total:</span>
                <span>₹{(calculateSubtotal(selectedOrder) * 1.05 - discount).toFixed(2)}</span>
              </div>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '20px', padding: '15px', fontSize: '1.1rem' }}
              onClick={handleGenerateInvoice}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Generate Invoice & Close Order'}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
            <i className="fa-solid fa-file-invoice" style={{ fontSize: '3rem', marginBottom: '15px' }}></i>
            <p>Select an order from the list to generate its bill.</p>
          </div>
        )}
      </div>
    </div>
  );
}
