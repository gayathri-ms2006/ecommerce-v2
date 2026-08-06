import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { fetchAdminOrders, updateAdminOrderStatus } from '../../services/admin';
import '../../styles/Admin.css';

const orderStatuses = ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase();
};

const getFulfillmentBadgeClass = (status) => {
  switch (status) {
    case 'Delivered': return 'success';
    case 'Cancelled': return 'danger';
    case 'Pending': return 'warning';
    case 'Processing':
    case 'Packed':
    case 'Shipped': return 'info';
    default: return 'warning';
  }
};

const getPaymentStatus = (status) => {
  if (status === 'Cancelled') return 'Refunded';
  if (status === 'Delivered') return 'Paid';
  return 'Authorized';
};

const getPaymentBadgeClass = (status) => {
  if (status === 'Cancelled') return 'danger';
  if (status === 'Delivered') return 'success';
  return 'info';
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Unable to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = `${order.orderId} ${order.customerName} ${order.email}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const handleStatusChange = async (orderId, nextStatus) => {
    try {
      const updated = await updateAdminOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((order) => (order.id === orderId || order.orderId === orderId ? { ...order, ...updated } : order)));
    } catch (err) {
      setError(err.message || 'Unable to update order status');
    }
  };

  // Compute orders metrics
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'Pending').length;
    const processing = orders.filter(o => o.status === 'Processing' || o.status === 'Packed' || o.status === 'Shipped').length;
    const delivered = orders.filter(o => o.status === 'Delivered').length;

    return { total, pending, processing, delivered };
  }, [orders]);

  return (
    <AdminLayout title="Orders" subtitle="Approve workflows and manage fulfillment">
      {/* Order Status Cards */}
      <div className="admin-kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card accent-blue">
          <div className="stat-card-label">Total Transactions</div>
          <div className="stat-card-value">{stats.total}</div>
          <div className="stat-card-subtext">All order logs</div>
        </div>
        <div className="admin-stat-card accent-warning">
          <div className="stat-card-label">Pending Reviews</div>
          <div className="stat-card-value">{stats.pending}</div>
          <div className="stat-card-subtext">Awaiting operator action</div>
        </div>
        <div className="admin-stat-card accent-purple">
          <div className="stat-card-label">Fulfillment Queue</div>
          <div className="stat-card-value">{stats.processing}</div>
          <div className="stat-card-subtext">Processing / Shipped orders</div>
        </div>
        <div className="admin-stat-card accent-green">
          <div className="stat-card-label">Completed Orders</div>
          <div className="stat-card-value">{stats.delivered}</div>
          <div className="stat-card-subtext">Delivered to customers</div>
        </div>
      </div>

      <div className="admin-panel-card">
        <div className="admin-panel-header">
          <div>
            <h3>Order Operations</h3>
            <p>Review customer purchases, payment authorization, and edit delivery statuses.</p>
          </div>
          <div className="admin-toolbar">
            <input
              className="admin-input"
              placeholder="Search by ID, name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="admin-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All Statuses</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <div className="admin-error-banner" style={{ marginBottom: '20px' }}>{error}</div> : null}

        {loading ? (
          <div className="admin-loading-state">Loading orders…</div>
        ) : filteredOrders.length === 0 ? (
          <div className="admin-empty-chart">No orders match search parameters</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Details</th>
                  <th>Order Total</th>
                  <th>Payment Status</th>
                  <th>Fulfillment Status</th>
                  <th>Action Trigger</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id || order.orderId}>
                    <td style={{ fontWeight: 700, fontSize: '12px' }}>
                      <code>{order.orderId}</code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="table-user-avatar">{getInitials(order.customerName)}</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontSize: '13px' }}>{order.customerName}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{order.email}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 800 }}>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`status-pill ${getPaymentBadgeClass(order.status)}`}>
                        {getPaymentStatus(order.status)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${getFulfillmentBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <select
                          className="admin-input"
                          value={order.status}
                          onChange={(event) => handleStatusChange(order.id || order.orderId, event.target.value)}
                          style={{ minWidth: '130px', padding: '6px 8px' }}
                        >
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              Set: {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
