import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { fetchAdminOrders, updateAdminOrderStatus } from '../../services/admin';
import '../../styles/Admin.css';

const orderStatuses = ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

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

  return (
    <AdminLayout title="Orders" subtitle="Approve workflows and manage fulfillment">
      <div className="admin-panel-card">
        <div className="admin-panel-header">
          <div>
            <h3>Order Operations</h3>
            <p>Search, filter, and update orders instantly.</p>
          </div>
          <div className="admin-toolbar">
            <input className="admin-input" placeholder="Search orders" value={search} onChange={(event) => setSearch(event.target.value)} />
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

        {error ? <div className="admin-error-banner">{error}</div> : null}

        {loading ? (
          <div className="admin-loading-state">Loading orders…</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderId}</td>
                    <td>
                      <div className="table-product-cell">
                        <strong>{order.customerName}</strong>
                        <span>{order.email}</span>
                      </div>
                    </td>
                    <td>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td>{order.createdAt}</td>
                    <td>
                      <span className={`status-pill ${order.status === 'Delivered' ? 'success' : order.status === 'Cancelled' ? 'danger' : 'warning'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <select className="admin-input" value={order.status} onChange={(event) => handleStatusChange(order.id, event.target.value)}>
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
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
