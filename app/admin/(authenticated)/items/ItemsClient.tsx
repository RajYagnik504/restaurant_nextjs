'use client';

import { useState } from 'react';
import { addItem, deleteItem, toggleItemAvailability } from './actions';

export default function ItemsClient({ items, categories }: { items: any[], categories: any[] }) {
  const [modalActive, setModalActive] = useState(false);

  return (
    <>
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Manage Menu Items</h2>
          <button className="btn-primary" onClick={() => setModalActive(true)}>
            <i className="fa-solid fa-plus"></i> New Item
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.description}</div>
                  </td>
                  <td>{item.category?.name || 'Uncategorized'}</td>
                  <td>
                    {item.is_veg ? (
                      <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Veg</span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Non-Veg</span>
                    )}
                  </td>
                  <td>₹{item.price}</td>
                  <td>
                    {item.is_available ? (
                      <span className="badge badge-success">Available</span>
                    ) : (
                      <span className="badge badge-danger">Out of Stock</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '5px 10px', fontSize: '0.85rem' }} 
                        onClick={async () => await toggleItemAvailability(item.id, item.is_available)}>
                        Toggle
                      </button>
                      <button 
                        className="btn-danger" 
                        style={{ padding: '5px 10px', fontSize: '0.85rem' }} 
                        onClick={async () => {
                          if(confirm('Are you sure you want to delete this item?')) {
                            await deleteItem(item.id);
                          }
                        }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center' }}>No items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`modal ${modalActive ? 'active' : ''}`}>
        <div className="modal-content" style={{ maxWidth: '400px' }}>
          <div className="modal-header">
            <h3>Add Menu Item</h3>
            <span className="close-modal" onClick={() => setModalActive(false)}>&times;</span>
          </div>
          <form action={async (formData) => {
            await addItem(formData);
            setModalActive(false);
          }}>
            <div className="form-group">
              <label>Item Name</label>
              <input type="text" name="name" required placeholder="e.g. Masala Dosa" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" name="description" placeholder="Optional" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category_id" required>
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Price (₹)</label>
                <input type="number" step="0.01" name="price" required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Type</label>
                <select name="is_veg" required>
                  <option value="true">Vegetarian</option>
                  <option value="false">Non-Vegetarian</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>Save Item</button>
          </form>
        </div>
      </div>
    </>
  );
}
