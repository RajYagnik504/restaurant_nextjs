'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ClientLayoutWrapper({ children, role }: { children: React.ReactNode, role: string }) {
  const pathname = usePathname();
  const [sidebarActive, setSidebarActive] = useState(false);
  const [profileDropdownActive, setProfileDropdownActive] = useState(false);

  const toggleSidebar = () => setSidebarActive(!sidebarActive);

  const closeDropdowns = (e: React.MouseEvent) => {
    if (!(e.target as Element).closest('.profile-circle')) {
      setProfileDropdownActive(false);
    }
  };

  const hasAccess = (allowedRoles: string[]) => allowedRoles.includes(role);

  return (
    <div onClick={closeDropdowns} style={{ display: 'flex', height: '100vh', width: '100%' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      
      {/* Sidebar */}
      <div className={`sidebar ${sidebarActive ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="dot"></div>
          <h2>ADMIN PANEL</h2>
        </div>
        <div className="sidebar-content">
          <div className="nav-section">
            <div className="nav-section-title">Overview</div>
            <Link href="/admin/dashboard" className={`nav-link ${pathname === '/admin/dashboard' ? 'active' : ''}`}>
              <i className="fa-solid fa-chart-pie"></i> Dashboard
            </Link>
          </div>
          
          <div className="nav-section">OPERATIONS</div>
          {hasAccess(['admin', 'manager', 'waiter', 'chef', 'cashier']) && (
            <Link href="/admin/live_orders" className={`nav-link ${pathname === '/admin/live_orders' ? 'active' : ''}`}>
              <i className="fa-solid fa-bell-concierge"></i> Live Orders / KDS
            </Link>
          )}
          {hasAccess(['admin', 'manager', 'cashier']) && (
            <>
              <Link href="/admin/billing" className={`nav-link ${pathname === '/admin/billing' ? 'active' : ''}`}>
                <i className="fa-solid fa-cash-register"></i> Billing / POS
              </Link>
              <Link href="/admin/invoices" className={`nav-link ${pathname === '/admin/invoices' ? 'active' : ''}`}>
                <i className="fa-solid fa-file-invoice"></i> Invoices
              </Link>
              <Link href="/admin/reports" className={`nav-link ${pathname === '/admin/reports' ? 'active' : ''}`}>
                <i className="fa-solid fa-calendar-check"></i> Reports & Day End
              </Link>
            </>
          )}

          {hasAccess(['admin', 'manager']) && (
            <>
              <div className="nav-section">MANAGEMENT</div>
              <Link href="/admin/categories" className={`nav-link ${pathname === '/admin/categories' ? 'active' : ''}`}>
                <i className="fa-solid fa-list"></i> Categories
              </Link>
              <Link href="/admin/items" className={`nav-link ${pathname === '/admin/items' ? 'active' : ''}`}>
                <i className="fa-solid fa-burger"></i> Menu Items
              </Link>
              <Link href="/admin/tables" className={`nav-link ${pathname === '/admin/tables' ? 'active' : ''}`}>
                <i className="fa-solid fa-chair"></i> Tables
              </Link>
              <Link href="/admin/inventory" className={`nav-link ${pathname === '/admin/inventory' ? 'active' : ''}`}>
                <i className="fa-solid fa-boxes-stacked"></i> Inventory
              </Link>
              <Link href="/admin/staff" className={`nav-link ${pathname === '/admin/staff' ? 'active' : ''}`}>
                <i className="fa-solid fa-users"></i> Staff & Logs
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-area">
        <div className="topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="mobile-menu-btn" onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.2rem', cursor: 'pointer' }}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <h1>Dashboard</h1>
          </div>
          <div className="topbar-right">
            <span style={{ marginRight: '15px', fontWeight: 'bold', textTransform: 'capitalize' }}>Role: {role}</span>
            <div className="profile-menu">
              <div className="profile-circle" onClick={() => setProfileDropdownActive(!profileDropdownActive)}>
                {role.charAt(0).toUpperCase()}
              </div>
              <div className={`dropdown ${profileDropdownActive ? 'active' : ''}`} id="profileDropdown">
                <Link href="#" className="dropdown-item">Change password</Link>
                <button 
                  className="dropdown-item" 
                  style={{ color: '#ef4444', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => {
                    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    window.location.href = '/admin/login';
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="content-wrapper">
          {children}
        </div>
        
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'auto', padding: '10px 0' }}>
          &copy; 2026 Raj / ShivShaktiSystem. All rights reserved.
        </div>
      </div>
    </div>
  );
}
