import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { fetchAdminAnalytics } from '../../services/admin';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import '../../styles/Admin.css';

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('30days'); // Default to 30 days for rich analytics trends

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchAdminAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const metrics = useMemo(() => {
    if (!data) return null;

    const { orders = [] } = data;
    const now = new Date();

    // 1. Filter Orders by Timeframe
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

    // 2. Overview Metrics
    const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const totalOrdersCount = filteredOrders.length;
    const aov = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;
    const cancellationRate = totalOrdersCount > 0 
      ? (filteredOrders.filter(o => o.status === 'Cancelled').length / totalOrdersCount) * 100 
      : 0;

    // 3. Trends Data (Revenue & Orders)
    const trends = [];
    if (filter === 'today') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const label = `${d.getHours()}:00`;
        const hourOrders = activeOrders.filter(o => {
          const oDate = new Date(o.createdAt);
          return oDate.getHours() === d.getHours() && oDate.toDateString() === d.toDateString();
        });
        const rev = hourOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        trends.push({ label, Revenue: rev, Orders: hourOrders.length });
      }
    } else if (filter === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = d.toISOString().split('T')[0];
        const dayOrders = activeOrders.filter(o => o.createdAt.startsWith(dateStr));
        const rev = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        trends.push({ label, Revenue: rev, Orders: dayOrders.length });
      }
    } else if (filter === '30days') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const label = `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
        const dateStr = d.toISOString().split('T')[0];
        const dayOrders = activeOrders.filter(o => o.createdAt.startsWith(dateStr));
        const rev = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        trends.push({ label, Revenue: rev, Orders: dayOrders.length });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        const yearMonth = d.toISOString().slice(0, 7);
        const monthOrders = activeOrders.filter(o => o.createdAt.startsWith(yearMonth));
        const rev = monthOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        trends.push({ label, Revenue: rev, Orders: monthOrders.length });
      }
    }

    // 4. Customer Growth (Cumulative orders over timeline)
    const chronologicalOrders = [...filteredOrders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let runningCustomerCount = 0;
    const addedCustomers = new Set();
    const customerGrowthData = [];

    chronologicalOrders.forEach((o) => {
      const orderDate = new Date(o.createdAt);
      const label = filter === 'today' 
        ? `${orderDate.getHours()}:00` 
        : filter === '7days' || filter === '30days'
          ? `${orderDate.getDate()} ${orderDate.toLocaleDateString('en-US', { month: 'short' })}`
          : orderDate.toLocaleDateString('en-US', { month: 'short' });

      if (o.userId && !addedCustomers.has(o.userId)) {
        addedCustomers.add(o.userId);
        runningCustomerCount += 1;
      }

      const existing = customerGrowthData.find(d => d.label === label);
      if (existing) {
        existing.Customers = runningCustomerCount;
      } else {
        customerGrowthData.push({ label, Customers: runningCustomerCount });
      }
    });

    // 5. Revenue by Product (Treemap format)
    const productRevenueMap = {};
    filteredOrders.forEach((o) => {
      const items = o.items || [];
      items.forEach((item) => {
        const name = item.productName || item.name || 'Unknown';
        productRevenueMap[name] = (productRevenueMap[name] || 0) + (Number(item.quantity || 1) * Number(item.price || 0));
      });
    });

    const productRevenueData = Object.entries(productRevenueMap)
      .map(([name, value]) => ({ name, size: value }))
      .filter(p => p.size > 0)
      .sort((a, b) => b.size - a.size)
      .slice(0, 10); // Keep top 10 for clean visualization

    return {
      totalRevenue,
      totalOrdersCount,
      aov,
      cancellationRate,
      trends,
      customerGrowthData,
      productRevenueData
    };
  }, [data, filter]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  return (
    <AdminLayout title="Analytics" subtitle="Deep intelligence models, customer metrics, and revenue attribution">
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
          🔄 Refresh Analytics
        </button>
      </div>

      {loading ? (
        <div className="admin-loading-state">Computing analytics models…</div>
      ) : metrics ? (
        <>
          {/* Stat Cards Row */}
          <div className="admin-kpi-grid">
            <div className="admin-stat-card accent-green">
              <div className="stat-card-header">
                <span className="stat-card-label">Revenue Overview</span>
                <span className="stat-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </span>
              </div>
              <div className="stat-card-value">{formatCurrency(metrics.totalRevenue)}</div>
              <div className="stat-card-subtext">Total active transactions</div>
            </div>

            <div className="admin-stat-card accent-blue">
              <div className="stat-card-header">
                <span className="stat-card-label">Total Transactions</span>
                <span className="stat-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </span>
              </div>
              <div className="stat-card-value">{metrics.totalOrdersCount}</div>
              <div className="stat-card-subtext">Total orders registered</div>
            </div>

            <div className="admin-stat-card accent-purple">
              <div className="stat-card-header">
                <span className="stat-card-label">AOV Metrics</span>
                <span className="stat-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </span>
              </div>
              <div className="stat-card-value">{formatCurrency(metrics.aov)}</div>
              <div className="stat-card-subtext">Average spend per basket</div>
            </div>

            <div className="admin-stat-card accent-warning">
              <div className="stat-card-header">
                <span className="stat-card-label">Cancellation Rate</span>
                <span className="stat-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                  </svg>
                </span>
              </div>
              <div className="stat-card-value">{metrics.cancellationRate.toFixed(1)}%</div>
              <div className="stat-card-subtext">Cancelled order percentage</div>
            </div>
          </div>

          <div className="admin-chart-grid" style={{ marginTop: '24px' }}>
            {/* Revenue Trend Line */}
            <div className="admin-chart-card">
              <div className="chart-card-header">
                <h3>Revenue Growth Curve</h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Timeline sales analysis</span>
              </div>
              <div className="admin-chart-container">
                <ResponsiveContainer>
                  <AreaChart data={metrics.trends}>
                    <defs>
                      <linearGradient id="analyticsRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                    <Area type="monotone" dataKey="Revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#analyticsRevGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Orders Trend Area */}
            <div className="admin-chart-card">
              <div className="chart-card-header">
                <h3>Order Volumetrics</h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Transactions curve</span>
              </div>
              <div className="admin-chart-container">
                <ResponsiveContainer>
                  <AreaChart data={metrics.trends}>
                    <defs>
                      <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Orders" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#orderGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="admin-chart-grid" style={{ marginTop: '24px' }}>
            {/* Customer Growth Line */}
            <div className="admin-chart-card">
              <div className="chart-card-header">
                <h3>Active Customer Growth</h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Cumulative unique purchasers</span>
              </div>
              {metrics.customerGrowthData.length === 0 ? (
                <div className="admin-empty-chart">No customer growth logs in timeframe</div>
              ) : (
                <div className="admin-chart-container">
                  <ResponsiveContainer>
                    <LineChart data={metrics.customerGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(value) => [`${value} Customers`]} />
                      <Line type="monotone" dataKey="Customers" stroke="#3B82F6" strokeWidth={3} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Revenue By Product (Attribution Bar Chart) */}
            <div className="admin-chart-card">
              <div className="chart-card-header">
                <h3>Revenue Attribution by Product</h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Total currency generated per product (Top 10)</span>
              </div>
              {metrics.productRevenueData.length === 0 ? (
                <div className="admin-empty-chart">No product revenue attribution in timeframe</div>
              ) : (
                <div className="admin-chart-container">
                  <ResponsiveContainer>
                    <BarChart data={metrics.productRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} tickFormatter={(val) => val.slice(0, 10) + '..'} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                      <Bar dataKey="size" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </AdminLayout>
  );
};

export default AdminAnalytics;
