'use client';

import { useEffect, useState } from 'react';
import { fetchLiveOrders, updateOrderStatus } from './actions';

export default function LiveOrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);

  // Simple edge-friendly polling (every 5 seconds) to replace Socket.io
  useEffect(() => {
    const interval = setInterval(async () => {
      const freshOrders = await fetchLiveOrders();
      setOrders(freshOrders);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    // Optimistic UI update
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    await updateOrderStatus(orderId, status);
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'received': return 'badge-secondary';
      case 'preparing': return 'badge-warning';
      case 'served': return 'badge-success';
      case 'completed': return 'badge-primary';
      default: return 'badge-secondary';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Live Orders Dashboard</h2>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <i className="fa-solid fa-circle-dot" style={{ color: '#10b981', marginRight: '5px' }}></i>
          Live Polling Active (5s)
        </div>
      </div>
      
      <div className="orders-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {orders.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: 'var(--card-bg)', borderRadius: '12px' }}>
            <i className="fa-solid fa-mug-hot" style={{ fontSize: '3rem', color: 'var(--text-secondary)', marginBottom: '15px' }}></i>
            <h3>No active orders</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Kitchen is clear.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="card" style={{ borderTop: `4px solid ${order.order_type === 'parcel' ? '#eab308' : '#3b82f6'}` }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>Order #{order.id}</h3>
                <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>
              
              <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong>{order.order_type === 'parcel' ? 'Parcel / Takeaway' : `Table ${order.table?.table_number}`}</strong>
                <br />
                Ordered at: {new Date(order.created_at).toLocaleTimeString()}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {order.items.map((item: any) => (
                    <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed var(--border-color)' }}>
                      <span>{item.quantity}x {item.menu_item?.name || 'Unknown Item'}</span>
                      {item.notes && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>({item.notes})</span>}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {order.status === 'received' && (
                  <button className="btn-primary" style={{ flex: 1, background: '#f59e0b' }} onClick={() => handleUpdateStatus(order.id, 'preparing')}>
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button className="btn-primary" style={{ flex: 1, background: '#10b981' }} onClick={() => handleUpdateStatus(order.id, 'served')}>
                    Mark Served
                  </button>
                )}
                {order.status === 'served' && (
                  <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleUpdateStatus(order.id, 'completed')}>
                    Complete Order
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
