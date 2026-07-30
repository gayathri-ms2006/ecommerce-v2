import React from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../../services/auth';

const menuItems = [
  { path: '/admin/dashboard', label: 'Dashboard' },
  { path: '/admin/products', label: 'Products' },
  { path: '/admin/inventory', label: 'Inventory' },
  { path: '/admin/orders', label: 'Orders' },
  { path: '/admin/customers', label: 'Customers' },
  { path: '/admin/analytics', label: 'Analytics' },
  { path: '/admin/settings', label: 'Settings' },
];

const AdminLayout = ({ title, subtitle, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/admin/login');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand-block">
          <div className="admin-brand-mark">E</div>
          <div>
            <h2>Admin Portal</h2>
            <p>Seller Command Center</p>
          </div>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/products" className="admin-link-button">
            View Storefront
          </Link>
          <button type="button" className="admin-logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main-panel">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">Operations Overview</p>
            <h1>{title}</h1>
            <p className="topbar-subtitle">{subtitle}</p>
          </div>

          <div className="topbar-actions">
            <span className="topbar-badge">{location.pathname.split('/').pop()}</span>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
