'use client';
import { useState, useEffect } from 'react';
import { fetchDailyReport, processDayEnd } from './actions';

export default function ReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dayEndModal, setDayEndModal] = useState(false);
  const [successModal, setSuccessModal] = useState<{show: boolean, data: any}>({ show: false, data: null });

  const [expectedCash, setExpectedCash] = useState(0);

  useEffect(() => {
    fetchDailyReport().then(data => {
      setReport(data);
      setLoading(false);
    });
  }, []);

  const handleDayEnd = async () => {
    const res = await processDayEnd(expectedCash, 0, 0);
    setDayEndModal(false);
    setSuccessModal({ show: true, data: res });
  };

  if (loading) return <div>Loading reports...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Daily Sales Report & Day-End Close</h2>
      <p style={{ color: '#64748b' }}>Calculating totals from midnight today to now.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '20px' }}>
        <div className="stat-card">
          <div className="stat-title">Total Sales (Gross)</div>
          <div className="stat-value">₹{report.totalSales}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Refunds</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>₹{report.totalRefunds}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-title">Net Sales</div>
          <div className="stat-value">₹{report.netSales}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Orders</div>
          <div className="stat-value">{report.orderCount}</div>
        </div>
      </div>

      <div style={{ marginTop: '30px', display: 'flex', gap: '40px' }}>
        <div style={{ flex: 1 }}>
          <h3>Payment Breakdown</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <tbody>
              {Object.entries(report.paymentBreakdown).map(([method, amount]: any) => (
                <tr key={method} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 0', fontWeight: 'bold' }}>{method}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>₹{amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', borderRadius: '12px', padding: '20px' }}>
          <i className="fa-solid fa-lock" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '15px' }}></i>
          <h3>Ready to close the day?</h3>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '20px' }}>This will log the Day-End Record and freeze today's accounting metrics.</p>
          <button className="btn-primary" onClick={() => {
            setExpectedCash(report.paymentBreakdown.Cash);
            setDayEndModal(true);
          }} style={{ background: '#ef4444', border: 'none', width: '100%' }}>Initiate Day-End Close</button>
        </div>
      </div>

      {dayEndModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h2>Confirm Day-End</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>System Cash Drawer Total:</label>
              <div style={{ padding: '10px', background: '#f1f5f9', fontWeight: 'bold' }}>₹{report.paymentBreakdown.Cash}</div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Physical Cash Counted (₹):</label>
              <input type="number" value={expectedCash} onChange={e => setExpectedCash(Number(e.target.value))} style={{ width: '100%', padding: '8px' }} />
              <small style={{ color: expectedCash === report.paymentBreakdown.Cash ? '#10b981' : '#ef4444' }}>
                Discrepancy: ₹{expectedCash - report.paymentBreakdown.Cash}
              </small>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" onClick={handleDayEnd} style={{ flex: 1, background: '#ef4444', border: 'none' }}>Confirm & Close Day</button>
              <button onClick={() => setDayEndModal(false)} style={{ padding: '10px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {successModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '12px', width: '400px', textAlign: 'center' }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: '4rem', color: '#10b981', marginBottom: '20px' }}></i>
            <h2>Day Closed Successfully</h2>
            <p>Total Sales: ₹{successModal.data.totalSales}</p>
            <p style={{ color: successModal.data.discrepancy === 0 ? '#10b981' : '#ef4444' }}>
              Cash Discrepancy: ₹{successModal.data.discrepancy}
            </p>
            <button className="btn-primary" onClick={() => setSuccessModal({ show: false, data: null })} style={{ marginTop: '20px', width: '100%' }}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}
