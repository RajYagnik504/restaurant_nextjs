'use client';

import { useState } from 'react';
import { addRawMaterial, adjustStock } from './actions';

export default function InventoryClient({ materials, logs }: { materials: any[], logs: any[] }) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);

  const openModal = (id: string, materialId?: number) => {
    setActiveModal(id);
    if (materialId) setSelectedMaterialId(materialId);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedMaterialId(null);
  };

  return (
    <>
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Raw Materials Stock</h2>
          <button className="btn-primary" onClick={() => openModal('newMaterialModal')}>
            <i className="fa-solid fa-plus"></i> New Material
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Current Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(mat => (
                <tr key={mat.id}>
                  <td>
                    <strong>{mat.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Threshold: {mat.low_stock_threshold} {mat.unit}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                      {mat.current_stock}
                    </span> <span style={{ color: 'var(--text-secondary)' }}>{mat.unit}</span>
                  </td>
                  <td>
                    {mat.current_stock <= mat.low_stock_threshold ? (
                      <span className="badge badge-danger">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">Normal</span>
                    )}
                  </td>
                  <td>
                    <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: '0.85rem' }} onClick={() => openModal('addStockModal', mat.id)}>
                      Update Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h2>Recent History</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Material</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>{log.raw_material?.name}</td>
                  <td>
                    <span className={`badge ${log.type === 'add' ? 'badge-success' : 'badge-danger'}`}>
                      {log.type.toUpperCase()}
                    </span>
                  </td>
                  <td>{log.quantity}</td>
                  <td>{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Material Modal */}
      <div id="newMaterialModal" className={`modal ${activeModal === 'newMaterialModal' ? 'active' : ''}`}>
        <div className="modal-content" style={{ maxWidth: '500px' }}>
          <div className="modal-header">
            <h3>Add New Raw Material</h3>
            <span className="close-modal" onClick={closeModal}>&times;</span>
          </div>
          <form action={async (formData) => {
            await addRawMaterial(formData);
            closeModal();
          }}>
            <div className="form-group">
              <label>Material Name</label>
              <input type="text" name="name" required placeholder="e.g. Burger Bun" />
            </div>
            <div className="form-group">
              <label>Unit (kg, packet, piece)</label>
              <input type="text" name="unit" required placeholder="e.g. pieces" />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Initial Stock</label>
                <input type="number" step="0.01" name="initial_stock" defaultValue="0" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Low Stock Alert At</label>
                <input type="number" step="0.01" name="low_stock_threshold" defaultValue="10" />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>Save Material</button>
          </form>
        </div>
      </div>

      {/* Update Stock Modal */}
      <div id="addStockModal" className={`modal ${activeModal === 'addStockModal' ? 'active' : ''}`}>
        <div className="modal-content" style={{ maxWidth: '400px' }}>
          <div className="modal-header">
            <h3>Update Stock</h3>
            <span className="close-modal" onClick={closeModal}>&times;</span>
          </div>
          <form action={async (formData) => {
            await adjustStock(formData);
            closeModal();
          }}>
            <input type="hidden" name="material_id" value={selectedMaterialId || ''} />
            <div className="form-group">
              <label>Action</label>
              <select name="type" required>
                <option value="add">Add Stock (Received)</option>
                <option value="deduct">Deduct Stock (Wastage/Used)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" step="0.01" name="quantity" required placeholder="e.g. 50" min="0.01" />
            </div>
            <div className="form-group">
              <label>Reason (Optional)</label>
              <input type="text" name="reason" placeholder="e.g. Daily supply received" />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>Confirm Update</button>
          </form>
        </div>
      </div>
    </>
  );
}
