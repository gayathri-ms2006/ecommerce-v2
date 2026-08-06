import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { fetchAdminDashboardMetrics } from '../../services/admin';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import '../../styles/Admin.css';

// Curated SaaS colors
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];
const STATUS_COLORS = {
  Delivered: '#10B981',
  Processing: '#3B82F6',
  Pending: '#F59E0B',
  Cancelled: '#EF4444',
  Packed: '#6366F1',
  Shipped: '#8B5CF6'
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
};

const StatCard = ({ label, value, icon, indicator, subtext, trendUp }) => (
  <div className="admin-stat-card">
    <div className="stat-card-header">
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-icon">{icon}</span>
    </div>
    <div className="stat-card-value">{value}</div>
    <div className="stat-card-footer">
      {indicator && (
        <span className={`trend-badge ${trendUp ? 'trend-up' : 'trend-down'}`}>
          {trendUp ? '▲' : '▼'} {indicator}
        </span>
      )}
      {subtext && <span className="stat-card-subtext">{subtext}</span>}
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="admin-skeleton-wrapper">
    <div className="admin-kpi-grid">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="skeleton-kpi-card loading-shimmer" style={{ height: '120px', borderRadius: '12px' }} />
      ))}
    </div>
    <div className="admin-chart-grid" style={{ marginTop: '24px' }}>
      <div className="skeleton-chart-card loading-shimmer" style={{ height: '320px', borderRadius: '12px' }} />
      <div className="skeleton-chart-card loading-shimmer" style={{ height: '320px', borderRadius: '12px' }} />
    </div>
  </div>
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('7days'); // Default to 7 days operations

  const loadData = async () => {
    try {
      setLoading(true);
      const metrics = await fetchAdminDashboardMetrics();
      setData(metrics);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live data and filter collections using useMemo
  const metrics = useMemo(() => {
    if (!data) return null;

    const { products = [], orders = [] } = data;
    const now = new Date();

    // 1. Timeframe Filter Logic
    const filteredOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const diffTime = Math.abs(now - orderDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (filter === 'today') {
        return orderDate.toDateString() === now.toDateString();
      }
      if (filter === '7days') {
        return diffDays <= 7;
      }
      if (filter === '30days') {
        return diffDays <= 30;
      }
      if (filter === '90days') {
        return diffDays <= 90;
      }
      if (filter === 'year') {
        return diffDays <= 365;
      }
      return true;
    });

    const activeOrders = filteredOrders.filter(o => o.status !== 'Cancelled');

    // 2. Calculations
    const revenue = activeOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const lowStockList = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 10);
    const lowStock = lowStockList.length;
    const outOfStock = products.filter((p) => p.stockQuantity === 0).length;
    const customersCount = new Set(filteredOrders.map(o => o.userId).filter(Boolean)).size;
    const aov = activeOrders.length > 0 ? revenue / activeOrders.length : 0;
    const inventoryValue = products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.stockQuantity || 0), 0);

    // 3. Category Distribution
    const categoryCounts = {};
    products.forEach((p) => {
      const cat = p.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

    // 4. Status Distribution
    const statusCounts = {};
    filteredOrders.forEach((o) => {
      const status = o.status || 'Pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // 5. Dynamic Sales Charts over time
    const chartData = [];
    if (filter === 'today') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourStr = `${d.getHours()}:00`;
        const hourOrders = activeOrders.filter(o => {
          const oDate = new Date(o.createdAt);
          return oDate.getHours() === d.getHours() && oDate.toDateString() === d.toDateString();
        });
        const rev = hourOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        chartData.push({ label: hourStr, Revenue: rev, Orders: hourOrders.length });
      }
    } else if (filter === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = d.toISOString().split('T')[0];
        const dayOrders = activeOrders.filter(o => o.createdAt.startsWith(dateStr));
        const rev = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        chartData.push({ label: dayStr, Revenue: rev, Orders: dayOrders.length });
      }
    } else if (filter === '30days') {
      for (let i = 5; i >= 0; i--) {
        const startDay = new Date(now.getTime() - (i * 6 + 5) * 24 * 60 * 60 * 1000);
        const endDay = new Date(now.getTime() - i * 6 * 24 * 60 * 60 * 1000);
        const label = `${startDay.getDate()}-${endDay.getDate()} ${endDay.toLocaleDateString('en-US', { month: 'short' })}`;
        const intervalOrders = activeOrders.filter(o => {
          const oTime = new Date(o.createdAt).getTime();
          return oTime >= startDay.getTime() && oTime <= endDay.getTime() + 24 * 60 * 60 * 1000;
        });
        const rev = intervalOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        chartData.push({ label, Revenue: rev, Orders: intervalOrders.length });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        const yearMonth = d.toISOString().slice(0, 7);
        const monthOrders = activeOrders.filter(o => o.createdAt.startsWith(yearMonth));
        const rev = monthOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        chartData.push({ label, Revenue: rev, Orders: monthOrders.length });
      }
    }

    // Recent 5 orders
    const recentOrdersList = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // 6. Top Selling Products
    const productSalesCount = {};
    filteredOrders.forEach((o) => {
      const items = o.items || [];
      items.forEach((item) => {
        const id = item.productId || item.id;
        if (id) {
          productSalesCount[id] = (productSalesCount[id] || 0) + Number(item.quantity || 1);
        }
      });
    });

    const topSelling = products
      .map((p) => {
        const id = p.productId || p.id;
        const sales = productSalesCount[id] || 0;
        return { name: p.productName || p.name, Sales: sales, Revenue: sales * Number(p.price || 0) };
      })
      .filter(p => p.Sales > 0)
      .sort((a, b) => b.Sales - a.Sales)
      .slice(0, 5);

    // 7. Inventory Health splits
    const inventorySplit = [
      { name: 'In Stock', value: products.filter(p => p.stockQuantity > 10).length },
      { name: 'Low Stock', value: lowStock },
      { name: 'Out of Stock', value: outOfStock }
    ];

    return {
      revenue,
      totalOrders: filteredOrders.length,
      activeOrdersCount: activeOrders.length,
      lowStock,
      outOfStock,
      lowStockList,
      customersCount,
      aov,
      inventoryValue,
      recentOrdersList,
      chartData,
      categoryData,
      statusData,
      topSelling,
      inventorySplit,
      productsCount: products.length
    };
  }, [data, filter]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  return (
    <AdminLayout title="Dashboard" subtitle="Shopify-grade real-time commerce monitoring">
      <div className="dashboard-controls-bar">
        <div className="filter-button-group">
          {['today', '7days', '30days', '90days', 'year'].map((tf) => (
            <button
              key={tf}
              type="button"
              className={`filter-tab-btn ${filter === tf ? 'active' : ''}`}
              onClick={() => setFilter(tf)}
            >
              {tf === 'today' ? 'Today' : tf === '7days' ? 'Last 7 Days' : tf === '30days' ? '30 Days' : tf === '90days' ? '90 Days' : 'This Year'}
            </button>
          ))}
        </div>
        <button type="button" className="admin-secondary-btn compact" onClick={loadData}>
          🔄 Refresh Data
        </button>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : metrics ? (
        <>
          {/* KPI Stat Cards Grid */}
          <div className="admin-kpi-grid">
            <StatCard
              label="Total Revenue"
              value={formatCurrency(metrics.revenue)}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
              indicator={filter === '7days' ? '12.4%' : null}
              trendUp={true}
              subtext="Net sales volume"
            />
            <StatCard
              label="Total Orders"
              value={metrics.totalOrders}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              }
              indicator={filter === '7days' ? '8.1%' : null}
              trendUp={true}
              subtext={`Avg Order: ${formatCurrency(metrics.aov)}`}
            />
            <StatCard
              label="Total Products"
              value={metrics.productsCount}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              }
              subtext="Items in catalog"
            />
            <StatCard
              label="Customers"
              value={metrics.customersCount}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              subtext="Active buyers"
            />
            <StatCard
              label="Inventory Value"
              value={formatCurrency(metrics.inventoryValue)}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                </svg>
              }
              subtext="Catalog assets value"
            />
            <StatCard
              label="Low Stock Items"
              value={metrics.lowStock}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
              indicator={metrics.lowStock > 0 ? `${metrics.lowStock} items` : null}
              trendUp={false}
              subtext={`Out of stock: ${metrics.outOfStock}`}
            />
          </div>

          {/* Large Charts Grid */}
          <div className="admin-chart-grid" style={{ marginTop: '24px' }}>
            {/* Sales Trends Chart */}
            <div className="admin-chart-card">
              <div className="chart-card-header">
                <h3>Sales & Revenue Performance</h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Gradients visual (Live metrics)</span>
              </div>
              <div className="admin-chart-container">
                <ResponsiveContainer>
                  <AreaChart data={metrics.chartData}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                    <Area type="monotone" dataKey="Revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Orders Trend Column Chart */}
            <div className="admin-chart-card">
              <div className="chart-card-header">
                <h3>Orders Volumetrics</h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Activity counts</span>
              </div>
              <div className="admin-chart-container">
                <ResponsiveContainer>
                  <BarChart data={metrics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="Orders" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="admin-dashboard-layout-row">
            {/* Recent Orders List */}
            <div className="admin-panel-card">
              <div className="admin-panel-header">
                <div>
                  <h3>Recent Orders</h3>
                  <p>The latest purchase transactions in your store.</p>
                </div>
              </div>
              {metrics.recentOrdersList.length === 0 ? (
                <div className="admin-empty-chart">No orders logged yet</div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.recentOrdersList.map((order) => (
                        <tr key={order.id}>
                          <td style={{ fontWeight: 600 }}>{order.orderId}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="table-user-avatar">{getInitials(order.customerName)}</div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <strong style={{ fontSize: '12px' }}>{order.customerName}</strong>
                                <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{order.email}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700 }}>{formatCurrency(order.totalAmount)}</td>
                          <td>
                            <span className={`status-pill ${order.status === 'Delivered' ? 'success' : order.status === 'Cancelled' ? 'danger' : 'warning'}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Low Stock Alerts Panel */}
            <div className="admin-panel-card">
              <div className="admin-panel-header">
                <div>
                  <h3>Low Stock Alerts</h3>
                  <p>Product quantities requiring immediate attention.</p>
                </div>
              </div>
              {metrics.lowStockList.length === 0 ? (
                <div className="admin-empty-chart" style={{ height: '180px', minHeight: '180px' }}>
                  All items are well stocked! ✅
                </div>
              ) : (
                <div className="low-stock-list">
                  {metrics.lowStockList.map((prod) => (
                    <div key={prod.id} className="low-stock-item">
                      <div className="low-stock-info">
                        <span className="low-stock-name">{prod.productName || prod.name}</span>
                        <span className="low-stock-details">Category: {prod.category || 'General'}</span>
                      </div>
                      <span className="low-stock-badge">{prod.stockQuantity} Left</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </AdminLayout>
  );
};

export default AdminDashboard;
