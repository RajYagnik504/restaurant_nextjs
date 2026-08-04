'use client';

import { useState } from 'react';
import { addTable, deleteTable } from './actions';

export default function TablesClient({ tables }: { tables: any[] }) {
  const [modalActive, setModalActive] = useState(false);

  return (
    <>
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Manage Tables</h2>
          <button className="btn-primary" onClick={() => setModalActive(true)}>
            <i className="fa-solid fa-plus"></i> Add Table
          </button>
        </div>
        
        <div className="orders-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {tables.map(table => (
            <div key={table.id} className="card" style={{ textAlign: 'center', padding: '20px' }}>
              <i className="fa-solid fa-chair" style={{ fontSize: '2rem', color: table.status === 'occupied' ? 'var(--danger)' : 'var(--success)', marginBottom: '10px' }}></i>
              <h3>Table {table.table_number}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{table.seats} Seats</p>
              <div style={{ marginTop: '10px' }}>
                <span className={`badge ${table.status === 'occupied' ? 'badge-danger' : 'badge-success'}`}>
                  {table.status.toUpperCase()}
                </span>
              </div>
              <button 
                className="btn-danger" 
                style={{ width: '100%', marginTop: '15px', padding: '5px' }}
                onClick={async () => {
                  if(confirm('Delete table ' + table.table_number + '?')) {
                    await deleteTable(table.id);
                  }
                }}>
                Delete Table
              </button>
            </div>
          ))}
          {tables.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
              No tables found. Add a table to start.
            </div>
          )}
        </div>
      </div>

      <div className={`modal ${modalActive ? 'active' : ''}`}>
        <div className="modal-content" style={{ maxWidth: '400px' }}>
          <div className="modal-header">
            <h3>Add Table</h3>
            <span className="close-modal" onClick={() => setModalActive(false)}>&times;</span>
          </div>
          <form action={async (formData) => {
            await addTable(formData);
            setModalActive(false);
          }}>
            <div className="form-group">
              <label>Table Number</label>
              <input type="number" name="table_number" required placeholder="e.g. 1" />
            </div>
            <div className="form-group">
              <label>Seats</label>
              <input type="number" name="seats" defaultValue="4" required />
            </div>
            <div className="form-group">
              <label>Initial Status</label>
              <select name="status" required>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>Save Table</button>
          </form>
        </div>
      </div>
    </>
  );
}
