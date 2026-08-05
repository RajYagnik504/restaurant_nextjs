'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrderStatus, submitWaiterCall, submitFeedback } from './actions';

export default function OrderClient({ orderId, initialOrder }: { orderId: string, initialOrder: any }) {
  const router = useRouter();
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // SWR polling every 3 seconds
  const { data: order } = useSWR(orderId, getOrderStatus, {
    fallbackData: initialOrder,
    refreshInterval: 3000, 
    revalidateOnFocus: true
  });

  if (!order) return <div>Loading...</div>;

  const handleCallWaiter = async () => {
    setWaiterCalled(true);
    const res = await submitWaiterCall(orderId);
    if (!res.success) {
      alert('Failed to call waiter: ' + res.error);
      setWaiterCalled(false);
    } else {
      // Show simple toast feedback
      alert('Waiter called successfully. They will be with you shortly.');
    }
  };

  const handleFeedback = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    const res = await submitFeedback(orderId, rating, comment);
    if (res.success) {
      setFeedbackSubmitted(true);
    } else {
      alert('Failed to submit feedback');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#3b82f6';
      case 'preparing': return '#f59e0b';
      case 'served': return '#8b5cf6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      
      {order.status !== 'completed' && order.status !== 'cancelled' && (
        <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>Status</h2>
          <div style={{ 
            display: 'inline-block', 
            padding: '10px 20px', 
            borderRadius: '30px', 
            background: getStatusColor(order.status),
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            textTransform: 'uppercase'
          }}>
            {order.status}
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {order.type === 'dine-in' && (
              <>
                <button 
                  onClick={handleCallWaiter}
                  disabled={waiterCalled}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: waiterCalled ? '#f1f5f9' : 'white', cursor: waiterCalled ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  <i className="fa-solid fa-bell" style={{ color: waiterCalled ? '#94a3b8' : '#f59e0b' }}></i> {waiterCalled ? 'Waiter Called' : 'Call Waiter'}
                </button>
                <button 
                  onClick={() => router.push(`/menu?table=${order.table?.name}`)}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  <i className="fa-solid fa-plus"></i> Order More
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {order.status === 'completed' && !feedbackSubmitted && (
        <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#10b981' }}>Order Complete!</h2>
          <p style={{ color: '#64748b' }}>We hope you enjoyed your meal. Please rate your experience:</p>
          
          <div style={{ fontSize: '2rem', display: 'flex', justifyContent: 'center', gap: '10px', margin: '20px 0', cursor: 'pointer' }}>
            {[1,2,3,4,5].map(star => (
              <i 
                key={star} 
                className={`fa-${star <= rating ? 'solid' : 'regular'} fa-star`} 
                style={{ color: star <= rating ? '#fbbf24' : '#cbd5e1' }}
                onClick={() => setRating(star)}
              ></i>
            ))}
          </div>

          <textarea 
            placeholder="Any comments? (Optional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', marginBottom: '15px' }}
          ></textarea>

          <button onClick={handleFeedback} style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Submit Feedback
          </button>
        </div>
      )}

      {feedbackSubmitted && (
        <div className="card" style={{ background: '#dcfce7', color: '#166534', padding: '20px', borderRadius: '10px', textAlign: 'center', marginBottom: '20px' }}>
          <h3>Thank you for your feedback!</h3>
        </div>
      )}

      <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Order Details</h3>
        
        {order.items.map((item: any) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.menu_item.name} <span style={{ color: '#64748b', fontSize: '0.9rem' }}>x {item.quantity}</span></div>
              {item.kot_number && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Added in Round {item.kot_number}</div>}
            </div>
            <div style={{ fontWeight: 600 }}>₹{(item.price_at_order * item.quantity).toFixed(2)}</div>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '15px', borderTop: '2px dashed #e2e8f0', fontSize: '1.2rem', fontWeight: 'bold' }}>
          <div>Total</div>
          <div>₹{order.items.reduce((sum: number, item: any) => sum + (item.price_at_order * item.quantity), 0).toFixed(2)}</div>
        </div>
      </div>
      
    </div>
  );
}
