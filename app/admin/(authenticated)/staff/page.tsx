'use client';
import { useState, useEffect } from 'react';
import { fetchStaffAndLogs, addStaffMember, deleteStaffMember } from './actions';

export default function StaffPage() {
  const [data, setData] = useState<any>({ staff: [], logs: [] });
  const [loading, setLoading] = useState(true);
  
  // New Staff state
  const [newStaffModal, setNewStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', mobile: '', role: 'waiter', password: '' });

  const loadData = () => {
    setLoading(true);
    fetchStaffAndLogs().then(d => {
      setData(d);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddStaff = async () => {
    await addStaffMember(newStaff);
    setNewStaffModal(false);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      await deleteStaffMember(id);
      loadData();
    }
  };

  if (loading) return <div>Loading staff data...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Staff Management</h2>
        <button className="btn-primary" onClick={() => setNewStaffModal(true)}>+ Add Staff</button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: '15px' }}>Name</th>
                <th style={{ padding: '15px' }}>Mobile</th>
                <th style={{ padding: '15px' }}>Role</th>
                <th style={{ padding: '15px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.staff.map((s: any) => (
                <tr key={s.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '15px' }}>{s.name}</td>
                  <td style={{ padding: '15px' }}>{s.mobile}</td>
                  <td style={{ padding: '15px' }}>
                    <span className="badge badge-primary">{s.role}</span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    {s.role !== 'admin' && (
                      <button onClick={() => handleDelete(s.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1, background: '#f8fafc', padding: '20px', borderRadius: '8px', maxHeight: '500px', overflowY: 'auto' }}>
          <h3>Activity Log</h3>
          {data.logs.length === 0 && <p style={{ color: '#64748b' }}>No recent activity logs.</p>}
          {data.logs.map((log: any) => (
            <div key={log.id} style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(log.created_at).toLocaleString()}</div>
              <strong>{log.action}</strong>
              <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>{JSON.stringify(log.details)}</div>
            </div>
          ))}
        </div>
      </div>

      {newStaffModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h2>Add New Staff</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Name</label>
              <input type="text" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} style={{ width: '100%', padding: '8px' }} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Mobile (Login ID)</label>
              <input type="text" value={newStaff.mobile} onChange={e => setNewStaff({ ...newStaff, mobile: e.target.value })} style={{ width: '100%', padding: '8px' }} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Role</label>
              <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} style={{ width: '100%', padding: '8px' }}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="waiter">Waiter</option>
                <option value="chef">Chef</option>
                <option value="cashier">Cashier</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
              <input type="password" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} style={{ width: '100%', padding: '8px' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" onClick={handleAddStaff} style={{ flex: 1 }}>Save</button>
              <button onClick={() => setNewStaffModal(false)} style={{ padding: '10px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
