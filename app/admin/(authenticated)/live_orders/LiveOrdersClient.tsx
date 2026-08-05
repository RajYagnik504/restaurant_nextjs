'use client';

import { useEffect, useState, useRef } from 'react';
import useSWR from 'swr';
import { fetchLiveOrders, updateOrderStatus, fetchWaiterCalls, acknowledgeWaiterCall } from './actions';

// A simple base64 beep sound (short sine wave)
const BEEP_BASE64 = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAAD//w==";

export default function LiveOrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // SWR Hooks for 1.5s fast polling
  const { data: orders = initialOrders, mutate: mutateOrders } = useSWR('live_orders', fetchLiveOrders, { refreshInterval: 1500 });
  const { data: waiterCalls = [], mutate: mutateCalls } = useSWR('waiter_calls', fetchWaiterCalls, { refreshInterval: 1500 });

  // Sound triggering logic
  const prevOrdersCount = useRef(initialOrders.length);
  const prevCallsCount = useRef(0);
  const prevNewItemsFlags = useRef<{ [id: number]: boolean }>({});

  useEffect(() => {
    // Initialize audio on mount
    audioRef.current = new Audio(BEEP_BASE64);
  }, []);

  const playNotification = (message: string) => {
    if (!audioEnabled) return;
    
    // Play beep
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play blocked:', e));
    }
    
    // Play voice announcement
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(message);
      msg.rate = 1.1;
      window.speechSynthesis.speak(msg);
    }
  };

  useEffect(() => {
    let shouldPlayNewOrder = false;
    let announcement = '';

    // Check for new orders
    if (orders.length > prevOrdersCount.current) {
      shouldPlayNewOrder = true;
      announcement = "New Order Received";
    }
    
    // Check for KOT updates (has_new_items)
    orders.forEach((o: any) => {
      if (o.has_new_items && !prevNewItemsFlags.current[o.id]) {
        shouldPlayNewOrder = true;
        announcement = `New items added to Table ${o.table?.name || 'Order'}`;
      }
      prevNewItemsFlags.current[o.id] = o.has_new_items;
    });

    if (shouldPlayNewOrder) {
      playNotification(announcement);
    }
    prevOrdersCount.current = orders.length;
  }, [orders, audioEnabled]);

  useEffect(() => {
    // Check for new waiter calls
    if (waiterCalls.length > prevCallsCount.current) {
      playNotification("Waiter called");
    }
    prevCallsCount.current = waiterCalls.length;
  }, [waiterCalls, audioEnabled]);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    // Optimistic UI update
    mutateOrders(orders.map((o: any) => o.id === orderId ? { ...o, status, has_new_items: false } : o), false);
    await updateOrderStatus(orderId, status);
    mutateOrders(); // Revalidate
  };

  const handleAckCall = async (callId: number) => {
    mutateCalls(waiterCalls.filter((c: any) => c.id !== callId), false);
    await acknowledgeWaiterCall(callId);
    mutateCalls();
  };

  // Kanban Columns
  const newOrders = orders.filter((o: any) => o.status === 'new');
  const preparingOrders = orders.filter((o: any) => o.status === 'preparing');
  const servedOrders = orders.filter((o: any) => o.status === 'served');

  const renderOrderCard = (order: any) => (
    <div key={order.id} className="card" style={{ 
      borderTop: `4px solid ${order.type === 'parcel' ? '#eab308' : '#3b82f6'}`,
      background: order.has_new_items ? '#fefce8' : 'white',
      marginBottom: '15px'
    }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>#{order.id} {order.type === 'parcel' ? '(Parcel)' : `(${order.table?.name})`}</h3>
        {order.has_new_items && <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>NEW KOT</span>}
      </div>
      
      <div style={{ marginBottom: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        {new Date(order.created_at).toLocaleTimeString()}
        {order.customer_name && <div>Customer: {order.customer_name}</div>}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {order.items.map((item: any) => (
            <li key={item.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '5px 0', 
              borderBottom: '1px dashed var(--border-color)',
              fontWeight: item.kot_number > 1 ? 'bold' : 'normal',
              color: item.kot_number > 1 ? '#000' : 'inherit'
            }}>
              <span>
                {item.quantity}x {item.menu_item?.name || 'Item'} 
                {item.kot_number > 1 && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginLeft: '5px' }}>[R{item.kot_number}]</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '5px' }}>
        {order.status === 'new' && (
          <button className="btn-primary" style={{ flex: 1, background: '#f59e0b', fontSize: '0.9rem', padding: '8px' }} onClick={() => handleUpdateStatus(order.id, 'preparing')}>
            Accept
          </button>
        )}
        {order.status === 'preparing' && (
          <button className="btn-primary" style={{ flex: 1, background: '#10b981', fontSize: '0.9rem', padding: '8px' }} onClick={() => handleUpdateStatus(order.id, 'served')}>
            Serve
          </button>
        )}
        {order.status === 'served' && (
          <button className="btn-primary" style={{ flex: 1, background: '#3b82f6', fontSize: '0.9rem', padding: '8px' }} onClick={() => handleUpdateStatus(order.id, 'completed')}>
            Complete
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .kanban-col {
          flex: 1;
          background: #f1f5f9;
          border-radius: 8px;
          padding: 15px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          min-width: 300px;
        }
        .kanban-col h2 {
          margin-top: 0;
          font-size: 1.1rem;
          padding-bottom: 10px;
          border-bottom: 2px solid #cbd5e1;
          margin-bottom: 15px;
          position: sticky;
          top: 0;
          background: #f1f5f9;
          z-index: 10;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Kitchen Display Screen</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            onClick={() => setAudioEnabled(!audioEnabled)}
            style={{ 
              background: audioEnabled ? '#10b981' : '#ef4444', 
              color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' 
            }}
          >
            <i className={`fa-solid ${audioEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`} style={{ marginRight: '8px' }}></i>
            {audioEnabled ? 'Audio ON' : 'Click to Enable Audio'}
          </button>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <i className="fa-solid fa-circle-dot" style={{ color: '#10b981', marginRight: '5px' }}></i>
            Live KDS (1.5s)
          </div>
        </div>
      </div>

      {waiterCalls.length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
          {waiterCalls.map((call: any) => (
            <div key={call.id} style={{ background: '#ef4444', color: 'white', padding: '10px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px', minWidth: 'max-content', animation: 'pulse 2s infinite' }}>
              <div><i className="fa-solid fa-bell"></i> Waiter Call: <strong>{call.table_name}</strong></div>
              <button 
                onClick={() => handleAckCall(call.id)}
                style={{ background: 'white', color: '#ef4444', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Acknowledge
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
        
        {/* New Orders */}
        <div className="kanban-col">
          <h2><span style={{ background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem', marginRight: '8px' }}>{newOrders.length}</span> New / Received</h2>
          <div>
            {newOrders.map(renderOrderCard)}
            {newOrders.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>No new orders</div>}
          </div>
        </div>

        {/* Preparing */}
        <div className="kanban-col">
          <h2><span style={{ background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem', marginRight: '8px' }}>{preparingOrders.length}</span> Preparing</h2>
          <div>
            {preparingOrders.map(renderOrderCard)}
            {preparingOrders.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>Nothing preparing</div>}
          </div>
        </div>

        {/* Served (Ready to Checkout) */}
        <div className="kanban-col">
          <h2><span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem', marginRight: '8px' }}>{servedOrders.length}</span> Served</h2>
          <div>
            {servedOrders.map(renderOrderCard)}
            {servedOrders.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>No served tables</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
