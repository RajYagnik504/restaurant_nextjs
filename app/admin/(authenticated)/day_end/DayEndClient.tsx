'use client';

import { useState } from 'react';
import { generateDayEndReport } from './actions';

export default function DayEndClient() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{ totalSales: number, totalOrders: number } | null>(null);

  const handleCloseDay = async () => {
    if(!confirm("Are you sure you want to close the day and generate 'Aaj ka Data'?")) return;
    
    setLoading(true);
    try {
      const result = await generateDayEndReport();
      setSummary({ totalSales: result.totalSales, totalOrders: result.totalOrders });
      
      // Trigger CSV Download
      const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `aaj_ka_data_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Day closed successfully. Report downloaded.');
    } catch (err: any) {
      alert('Error closing day: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '40px' }}>
      <i className="fa-solid fa-lock" style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '20px' }}></i>
      <h2>Day End Close</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Closing the day will generate a consolidated CSV report of all sales and orders for today ("Aaj ka Data").
      </p>

      {summary && (
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Today's Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Sales</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>₹{summary.totalSales.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Orders</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.totalOrders}</div>
            </div>
          </div>
        </div>
      )}

      <button 
        className="btn-danger" 
        style={{ padding: '15px 30px', fontSize: '1.2rem', width: '100%' }}
        onClick={handleCloseDay}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Download "Aaj ka Data" & Close Day'}
      </button>
    </div>
  );
}
