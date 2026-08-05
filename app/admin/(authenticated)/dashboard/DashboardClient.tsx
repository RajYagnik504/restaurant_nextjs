'use client';

import { useState } from 'react';
import { settleBill, splitBillPortion, splitBillItems, processRefund } from './actions';

export default function DashboardClient({ initialData }: { initialData: any }) {
  const { activeOrders, recentInvoices, ledgers } = initialData;
  const [activeTab, setActiveTab] = useState('orders');

  // Modals state
  const [settleModal, setSettleModal] = useState<{ isOpen: boolean, order: any }>({ isOpen: false, order: null });
  const [splitModal, setSplitModal] = useState<{ isOpen: boolean, order: any, type: 'portion' | 'items' }>({ isOpen: false, order: null, type: 'portion' });
  const [refundModal, setRefundModal] = useState<{ isOpen: boolean, invoice: any }>({ isOpen: false, invoice: null });

  // Settle Bill state
  const [discount, setDiscount] = useState(0);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Split Bill state
  const [splitParts, setSplitParts] = useState(2);
  const [selectedItems, setSelectedItems] = useState<{id: number, qty: number}[]>([]);

  // Refund state
  const [refundAmount, setRefundAmount] = useState('');

  const calculateSubtotal = (order: any) => {
    if (!order) return 0;
    return order.items.reduce((acc: number, item: any) => acc + (item.price_at_order * item.quantity), 0);
  };

  const handleSettle = async () => {
    if (!settleModal.order) return;
    await settleBill(settleModal.order.id, paymentMethod, discount, Number(amountPaid) || 0, redeemedPoints);
    setSettleModal({ isOpen: false, order: null });
  };

  const handleSplit = async () => {
    if (!splitModal.order) return;
    if (splitModal.type === 'portion') {
      await splitBillPortion(splitModal.order.id, splitParts);
    } else {
      await splitBillItems(splitModal.order.id, selectedItems);
    }
    setSplitModal({ isOpen: false, order: null, type: 'portion' });
  };

  const handleRefund = async () => {
    if (!refundModal.invoice) return;
    await processRefund(refundModal.invoice.id, Number(refundAmount));
    setRefundModal({ isOpen: false, invoice: null });
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('orders')} style={{ fontWeight: activeTab === 'orders' ? 'bold' : 'normal' }}>Active Tables</button>
        <button onClick={() => setActiveTab('invoices')} style={{ fontWeight: activeTab === 'invoices' ? 'bold' : 'normal' }}>Invoice History</button>
        <button onClick={() => setActiveTab('ledger')} style={{ fontWeight: activeTab === 'ledger' ? 'bold' : 'normal' }}>Credit Ledger (Udhar)</button>
      </div>

      {activeTab === 'orders' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {activeOrders.length === 0 && <p>No active served tables ready for checkout.</p>}
          {activeOrders.map((order: any) => (
            <div key={order.id} className="card" style={{ borderTop: '4px solid #10b981' }}>
              <div className="card-header">
                <h3>{order.table?.name || 'Parcel'} (Order #{order.id})</h3>
                <span className="badge badge-success">SERVED</span>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Total: ₹{calculateSubtotal(order)}</strong>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{order.customer_name} ({order.customer_mobile})</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                  setSettleModal({ isOpen: true, order });
                  setDiscount(0);
                  setRedeemedPoints(0);
                  setAmountPaid('');
                  setPaymentMethod('Cash');
                }}>Settle Bill</button>
                <button className="btn-primary" style={{ background: '#3b82f6' }} onClick={() => setSplitModal({ isOpen: true, order, type: 'portion' })}>
                  Split
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div>
          <h3>Recent Invoices</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Invoice #</th>
                <th style={{ padding: '10px' }}>Table / Order</th>
                <th style={{ padding: '10px' }}>Total</th>
                <th style={{ padding: '10px' }}>Payment Method</th>
                <th style={{ padding: '10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv: any) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}>{inv.invoice_number}</td>
                  <td style={{ padding: '10px' }}>{inv.order?.table?.name || 'Parcel'}</td>
                  <td style={{ padding: '10px' }}>₹{inv.total}</td>
                  <td style={{ padding: '10px' }}>{inv.payment_method}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => setRefundModal({ isOpen: true, invoice: inv })}>Refund</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div>
          <h3>Credit Ledger (Udhar)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fee2e2', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Customer</th>
                <th style={{ padding: '10px' }}>Mobile</th>
                <th style={{ padding: '10px' }}>Amount Due</th>
                <th style={{ padding: '10px' }}>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {ledgers.map((ledger: any) => (
                <tr key={ledger.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}>{ledger.customer_name}</td>
                  <td style={{ padding: '10px' }}>{ledger.customer_mobile}</td>
                  <td style={{ padding: '10px', color: '#ef4444', fontWeight: 'bold' }}>₹{ledger.amount}</td>
                  <td style={{ padding: '10px' }}>INV ID: {ledger.invoice_id}</td>
                </tr>
              ))}
              {ledgers.length === 0 && <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>No outstanding credit.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Settle Modal */}
      {settleModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h2>Settle Bill: {settleModal.order?.table?.name || 'Parcel'}</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Subtotal:</span>
              <span>₹{calculateSubtotal(settleModal.order)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
              <span>Discount / Points Redeemed (₹):</span>
              <input type="number" value={discount} onChange={e => {
                setDiscount(Number(e.target.value));
                setRedeemedPoints(Number(e.target.value)); // Assuming 1 point = 1 Rs for simplicity in UI
              }} style={{ width: '80px', padding: '5px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontWeight: 'bold', fontSize: '1.2rem', borderTop: '2px solid #ccc', paddingTop: '10px' }}>
              <span>Final Total:</span>
              <span>₹{calculateSubtotal(settleModal.order) - discount}</span>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Payment Method:</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Credit">Credit (Udhar)</option>
              </select>
            </div>

            {paymentMethod === 'Cash' && (
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Customer Paid (₹):</label>
                <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} placeholder="e.g. 2000" />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: (Number(amountPaid) - (calculateSubtotal(settleModal.order) - discount)) > 0 ? '#10b981' : '#64748b', fontWeight: 'bold' }}>
                  <span>Return Change:</span>
                  <span>₹{Math.max(0, Number(amountPaid) - (calculateSubtotal(settleModal.order) - discount))}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" onClick={handleSettle} style={{ flex: 1 }}>Complete Payment</button>
              <button onClick={() => setSettleModal({ isOpen: false, order: null })} style={{ padding: '10px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Split Modal */}
      {splitModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '500px' }}>
            <h2>Split Bill</h2>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => setSplitModal({ ...splitModal, type: 'portion' })} style={{ flex: 1, padding: '10px', background: splitModal.type === 'portion' ? '#3b82f6' : '#e2e8f0', color: splitModal.type === 'portion' ? 'white' : 'black', border: 'none', borderRadius: '4px' }}>Portion-wise</button>
              <button onClick={() => setSplitModal({ ...splitModal, type: 'items' })} style={{ flex: 1, padding: '10px', background: splitModal.type === 'items' ? '#3b82f6' : '#e2e8f0', color: splitModal.type === 'items' ? 'white' : 'black', border: 'none', borderRadius: '4px' }}>Item-wise</button>
            </div>

            {splitModal.type === 'portion' ? (
              <div style={{ marginBottom: '20px' }}>
                <label>Split into how many parts?</label>
                <input type="number" min="2" max="10" value={splitParts} onChange={e => setSplitParts(Number(e.target.value))} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
                
                <div style={{ marginTop: '15px', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                  <p>Subtotal: ₹{calculateSubtotal(splitModal.order)}</p>
                  <p>Base Split: ₹{Math.floor(calculateSubtotal(splitModal.order) / splitParts)}</p>
                  <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>* Remainder fraction will be added to the last person's bill to ensure exact accounting.</p>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                {splitModal.order?.items.map((item: any) => (
                  <label key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                    <span>
                      <input type="checkbox" onChange={(e) => {
                        if (e.target.checked) setSelectedItems([...selectedItems, { id: item.id, qty: item.quantity }]);
                        else setSelectedItems(selectedItems.filter(i => i.id !== item.id));
                      }} /> {item.quantity}x {item.menu_item?.name}
                    </span>
                    <span>₹{item.price_at_order * item.quantity}</span>
                  </label>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" onClick={handleSplit} style={{ flex: 1 }}>Execute Split</button>
              <button onClick={() => setSplitModal({ isOpen: false, order: null, type: 'portion' })} style={{ padding: '10px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h2>Issue Refund</h2>
            <p>Invoice: {refundModal.invoice?.invoice_number}</p>
            <p>Invoice Total: ₹{refundModal.invoice?.total}</p>
            
            <div style={{ marginBottom: '20px' }}>
              <label>Refund Amount (₹):</label>
              <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
              <small style={{ color: '#ef4444' }}>This creates a Refund record. The original invoice total will remain unaltered for historical integrity.</small>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" onClick={handleRefund} style={{ flex: 1, background: '#ef4444' }}>Process Refund</button>
              <button onClick={() => setRefundModal({ isOpen: false, invoice: null })} style={{ padding: '10px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
