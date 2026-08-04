'use client';

import { useState } from 'react';
import { addCategory, deleteCategory } from './actions';

export default function CategoriesClient({ categories }: { categories: any[] }) {
  const [modalActive, setModalActive] = useState(false);

  return (
    <>
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Manage Categories</h2>
          <button className="btn-primary" onClick={() => setModalActive(true)}>
            <i className="fa-solid fa-plus"></i> New Category
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td><strong>{cat.name}</strong></td>
                  <td>{cat.description || '-'}</td>
                  <td>
                    <button 
                      className="btn-danger" 
                      style={{ padding: '5px 10px', fontSize: '0.85rem' }} 
                      onClick={async () => {
                        if(confirm('Are you sure you want to delete this category?')) {
                          await deleteCategory(cat.id);
                        }
                      }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`modal ${modalActive ? 'active' : ''}`}>
        <div className="modal-content" style={{ maxWidth: '400px' }}>
          <div className="modal-header">
            <h3>Add Category</h3>
            <span className="close-modal" onClick={() => setModalActive(false)}>&times;</span>
          </div>
          <form action={async (formData) => {
            await addCategory(formData);
            setModalActive(false);
          }}>
            <div className="form-group">
              <label>Category Name</label>
              <input type="text" name="name" required placeholder="e.g. Beverages" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" name="description" placeholder="Optional" />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>Save Category</button>
          </form>
        </div>
      </div>
    </>
  );
}
