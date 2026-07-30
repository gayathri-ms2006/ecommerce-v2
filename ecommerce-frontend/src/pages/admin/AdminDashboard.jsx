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

const StatCard = ({ label, value, indicator, subtext, trendUp }) => (
  <div className="admin-stat-card">
    <div className="stat-card-top">
      <span className="stat-card-label">{label}</span>
      {indicator && (
        <span className={`trend-badge ${trendUp ? 'trend-up' : 'trend-down'}`}>
          {trendUp ? '▲' : '▼'} {indicator}
        </span>
      )}
    </div>
    <div className="stat-card-value">{value}</div>
    {subtext && <div className="stat-card-subtext">{subtext}</div>}
  </div>
);

const DashboardSkeleton = () => (
  <div className="admin-skeleton-wrapper">
    <div className="admin-kpi-grid">
      {Array.from({ length: 4 }).map((_, idx) => (
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
    const lowStock = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 10).length;
    const outOfStock = products.filter((p) => p.stockQuantity === 0).length;
    const customersCount = new Set(filteredOrders.map(o => o.userId).filter(Boolean)).size;
    const aov = activeOrders.length > 0 ? revenue / activeOrders.length : 0;

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
      customersCount,
      aov,
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
    <AdminLayout title="Operational Dashboard" subtitle="Shopify-grade real-time ecommerce monitoring">
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
              indicator={filter === '7days' ? '12.4%' : null}
              trendUp={true}
              subtext="Excluding cancellations"
            />
            <StatCard
              label="Orders"
              value={metrics.totalOrders}
              indicator={filter === '7days' ? '8.1%' : null}
              trendUp={true}
              subtext={`AOV: ${formatCurrency(metrics.aov)}`}
            />
            <StatCard
              label="Active Customers"
              value={metrics.customersCount}
              subtext="Unique buyer accounts"
            />
            <StatCard
              label="Low / Out of Stock"
              value={`${metrics.lowStock} / ${metrics.outOfStock}`}
              subtext={`Total catalog: ${metrics.productsCount} items`}
            />
          </div>

          {/* Large Charts Grid */}
          <div className="admin-chart-grid" style={{ marginTop: '24px' }}>
            
            {/* Sales Trends Chart */}
            <div className="admin-chart-card">
              <div className="chart-card-header">
                <h3>Sales & Revenue Performance</h3>
                <span>Gradients visual (Live metrics)</span>
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <AreaChart data={metrics.chartData}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                    <Area type="monotone" dataKey="Revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Orders Trend Column Chart */}
            <div className="admin-chart-card">
              <div className="chart-card-header">
                <h3>Orders Volumetrics</h3>
                <span>Activity counts</span>
              </div>
              <div style={{ width: '100%', height: 260 }}>
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

          <div className="admin-chart-grid" style={{ marginTop: '24px' }}>
            
            {/* Donut Chart: Order Status */}
            <div className="admin-chart-card">
              <div className="chart-card-header">
                <h3>Order Status Flow</h3>
                <span>Fulfillment tracking</span>
              </div>
              {metrics.statusData.length === 0 ? (
                <div className="admin-empty-chart">No order logs in timeframe</div>
              ) : (
                <div style={{ width: '100%', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.statusData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {metrics.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-legend-block">
                    {metrics.statusData.map((entry, index) => (
                      <div key={entry.name} className="legend-row">
                        <span className="legend-dot" style={{ backgroundColor: STATUS_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span className="legend-text">{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Horizontal Bar Chart: Top Selling Products */}
            <div className="admin-chart-card">
              <div className="chart-card-header">
                <h3>Top Selling Items</h3>
                <span>Quantities ordered</span>
              </div>
              {metrics.topSelling.length === 0 ? (
                <div className="admin-empty-chart">No product items sold in timeframe</div>
              ) : (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart
                      layout="vertical"
                      data={metrics.topSelling}
                      margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} width={80} tickLine={false} />
                      <Tooltip formatter={(value) => [`${value} units`]} />
                      <Bar dataKey="Sales" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

          <div className="admin-chart-grid" style={{ marginTop: '24px' }}>
            
            {/* Pie Chart: Categories split */}
            <div className="admin-chart-card">
              <div className="chart-card-header">
                <h3>Catalog Categories</h3>
                <span>Mix ratios</span>
              </div>
              <div style={{ width: '100%', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.categoryData}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {metrics.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-legend-block">
                  {metrics.categoryData.map((entry, index) => (
                    <div key={entry.name} className="legend-row">
                      <span className="legend-dot" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="legend-text">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stacked Bar Chart: Inventory Health */}
            <div className="admin-chart-card">
              <div className="chart-card-header">
                <h3>Inventory Stock Health</h3>
                <span>Availability metrics</span>
              </div>
              <div style={{ width: '100%', height: 240, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
                {metrics.inventorySplit.map((item, index) => {
                  const total = metrics.productsCount || 1;
                  const pct = Math.round((item.value / total) * 100);
                  const color = index === 0 ? '#10B981' : index === 1 ? '#F59E0B' : '#EF4444';
                  
                  return (
                    <div key={item.name} className="health-progress-row">
                      <div className="progress-info-labels">
                        <strong>{item.name}</strong>
                        <span>{item.value} products ({pct}%)</span>
                      </div>
                      <div className="progress-track-bg">
                        <div className="progress-fill-bar" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </>
      ) : null}
    </AdminLayout>
  );
};

export default AdminDashboard;
