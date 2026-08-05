'use client';
import { useState, useEffect } from 'react';
import { fetchInventory, addRawMaterial, adjustStock } from './actions';

export default function InventoryPage() {
  const [data, setData] = useState<any>({ items: [], logs: [] });
  const [loading, setLoading] = useState(true);
  
  const [newItemModal, setNewItemModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', unit: 'kg', low_stock_threshold: 5 });

  const [adjustModal, setAdjustModal] = useState<{ isOpen: boolean, item: any, type: 'ADD' | 'REMOVE' }>({ isOpen: false, item: null, type: 'ADD' });
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const loadData = () => {
    setLoading(true);
    fetchInventory().then(d => {
      setData(d);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = async () => {
    await addRawMaterial(newItem);
    setNewItemModal(false);
    loadData();
  };

  const handleAdjust = async () => {
    await adjustStock(adjustModal.item.id, adjustModal.type, Number(adjustQty), adjustReason);
    setAdjustModal({ isOpen: false, item: null, type: 'ADD' });
    loadData();
  };

  if (loading) return <div>Loading inventory...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Inventory Management</h2>
        <button className="btn-primary" onClick={() => setNewItemModal(true)}>+ Add Material</button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: '15px' }}>Material</th>
                <th style={{ padding: '15px' }}>Current Stock</th>
                <th style={{ padding: '15px' }}>Threshold</th>
                <th style={{ padding: '15px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item: any) => {
                const isLowStock = item.current_stock <= item.low_stock_threshold;
                return (
                  <tr key={item.id} style={{ borderTop: '1px solid #e2e8f0', background: isLowStock ? '#fee2e2' : 'white' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{item.name}</td>
                    <td style={{ padding: '15px', color: isLowStock ? '#ef4444' : 'inherit', fontWeight: isLowStock ? 'bold' : 'normal' }}>
                      {item.current_stock} {item.unit}
                      {isLowStock && <span style={{ marginLeft: '10px', fontSize: '0.8rem', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '12px' }}>Low Stock</span>}
                    </td>
                    <td style={{ padding: '15px' }}>{item.low_stock_threshold} {item.unit}</td>
                    <td style={{ padding: '15px', display: 'flex', gap: '10px' }}>
                      <button onClick={() => setAdjustModal({ isOpen: true, item, type: 'ADD' })} style={{ padding: '5px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add</button>
                      <button onClick={() => setAdjustModal({ isOpen: true, item, type: 'REMOVE' })} style={{ padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>- Reduce</button>
                    </td>
                  </tr>
                );
              })}
              {data.items.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>No inventory items found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1, background: '#f8fafc', padding: '20px', borderRadius: '8px', maxHeight: '500px', overflowY: 'auto' }}>
          <h3>Stock Logs</h3>
          {data.logs.length === 0 && <p style={{ color: '#64748b' }}>No recent stock adjustments.</p>}
          {data.logs.map((log: any) => (
            <div key={log.id} style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(log.created_at).toLocaleString()}</div>
              <strong>{log.raw_material?.name}</strong>
              <span style={{ color: log.type === 'ADD' ? '#10b981' : '#ef4444', marginLeft: '5px', fontWeight: 'bold' }}>
                {log.type === 'ADD' ? '+' : '-'}{log.quantity}
              </span>
              <div style={{ fontSize: '0.9rem', marginTop: '4px', fontStyle: 'italic' }}>Reason: {log.reason}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Item Modal */}
      {newItemModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h2>Add Raw Material</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Material Name</label>
              <input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} style={{ width: '100%', padding: '8px' }} placeholder="e.g. Rice, Tomatoes" />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Unit</label>
              <select value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} style={{ width: '100%', padding: '8px' }}>
                <option value="kg">Kilograms (kg)</option>
                <option value="ltr">Liters (ltr)</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="pkt">Packets (pkt)</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Low Stock Alert Threshold</label>
              <input type="number" value={newItem.low_stock_threshold} onChange={e => setNewItem({ ...newItem, low_stock_threshold: Number(e.target.value) })} style={{ width: '100%', padding: '8px' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" onClick={handleAddItem} style={{ flex: 1 }}>Save Item</button>
              <button onClick={() => setNewItemModal(false)} style={{ padding: '10px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h2>{adjustModal.type === 'ADD' ? 'Add Stock' : 'Reduce Stock'}</h2>
            <p style={{ fontWeight: 'bold' }}>{adjustModal.item?.name}</p>
            <p style={{ marginBottom: '15px', color: '#64748b' }}>Current: {adjustModal.item?.current_stock} {adjustModal.item?.unit}</p>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Quantity to {adjustModal.type === 'ADD' ? 'Add' : 'Remove'} ({adjustModal.item?.unit})</label>
              <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} style={{ width: '100%', padding: '8px' }} />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Reason / Source</label>
              <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} style={{ width: '100%', padding: '8px' }} placeholder={adjustModal.type === 'ADD' ? "e.g. Vendor delivery" : "e.g. Kitchen consumption"} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" onClick={handleAdjust} style={{ flex: 1, background: adjustModal.type === 'ADD' ? '#10b981' : '#ef4444' }}>Confirm</button>
              <button onClick={() => setAdjustModal({ isOpen: false, item: null, type: 'ADD' })} style={{ padding: '10px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
