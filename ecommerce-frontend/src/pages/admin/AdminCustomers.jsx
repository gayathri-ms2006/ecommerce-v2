import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { fetchAdminUsers } from '../../services/admin';
import '../../styles/Admin.css';

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase();
};

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('totalSpend'); // Default sorting by total spend
  const [expandedUserId, setExpandedUserId] = useState(null);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const data = await fetchAdminUsers();
        setCustomers(data);
      } catch (err) {
        console.error('Failed to load customers:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  // Compute Customer Insights cards based on users list
  const insights = useMemo(() => {
    if (!customers || customers.length === 0) {
      return {
        topSpender: { name: 'N/A', spend: 0 },
        mostActive: { name: 'N/A', count: 0 },
        avgClv: 0,
        repeatRate: 0,
      };
    }

    let topSpendVal = -1;
    let topSpenderObj = null;

    let mostActiveVal = -1;
    let mostActiveObj = null;

    let totalCohortSpend = 0;
    let repeatBuyersCount = 0;

    customers.forEach((c) => {
      totalCohortSpend += Number(c.totalSpend || 0);

      if (Number(c.totalSpend || 0) > topSpendVal) {
        topSpendVal = Number(c.totalSpend);
        topSpenderObj = c;
      }

      if (Number(c.totalOrders || 0) > mostActiveVal) {
        mostActiveVal = Number(c.totalOrders);
        mostActiveObj = c;
      }

      if (Number(c.totalOrders || 0) > 1) {
        repeatBuyersCount += 1;
      }
    });

    return {
      topSpender: {
        name: topSpenderObj ? (topSpenderObj.name || 'Customer') : 'N/A',
        spend: topSpendVal > 0 ? topSpendVal : 0,
      },
      mostActive: {
        name: mostActiveObj ? (mostActiveObj.name || 'Customer') : 'N/A',
        count: mostActiveVal > 0 ? mostActiveVal : 0,
      },
      avgClv: totalCohortSpend / customers.length,
      repeatRate: (repeatBuyersCount / customers.length) * 100,
    };
  }, [customers]);

  // Handle filtering and sorting
  const processedCustomers = useMemo(() => {
    let result = customers.filter((user) =>
      `${user.name} ${user.email} ${user.id}`.toLowerCase().includes(search.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === 'totalSpend') {
        return Number(b.totalSpend || 0) - Number(a.totalSpend || 0);
      }
      if (sortBy === 'totalOrders') {
        return Number(b.totalOrders || 0) - Number(a.totalOrders || 0);
      }
      if (sortBy === 'aov') {
        return Number(b.averageOrderValue || 0) - Number(a.averageOrderValue || 0);
      }
      if (sortBy === 'lastPurchase') {
        return new Date(b.lastPurchaseAt) - new Date(a.lastPurchaseAt);
      }
      return 0;
    });

    return result;
  }, [customers, search, sortBy]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout title="Customers" subtitle="Understand customer lifetime value, metrics, and purchasing patterns">
      {/* Customer Insights KPIs */}
      <div className="admin-kpi-grid">
        <div className="admin-stat-card accent-green">
          <div className="stat-card-label">Highest Spender</div>
          <div className="stat-card-value" style={{ fontSize: '18px', margin: '4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {insights.topSpender.name}
          </div>
          <div className="stat-card-subtext">Lifetime spend: {formatCurrency(insights.topSpender.spend)}</div>
        </div>

        <div className="admin-stat-card accent-blue">
          <div className="stat-card-label">Most Active Buyer</div>
          <div className="stat-card-value" style={{ fontSize: '18px', margin: '4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {insights.mostActive.name}
          </div>
          <div className="stat-card-subtext">{insights.mostActive.count} orders completed</div>
        </div>

        <div className="admin-stat-card accent-purple">
          <div className="stat-card-label">Cohort Lifetime Value</div>
          <div className="stat-card-value">
            {formatCurrency(insights.avgClv)}
          </div>
          <div className="stat-card-subtext">Avg spend per customer</div>
        </div>

        <div className="admin-stat-card accent-warning">
          <div className="stat-card-label">Repeat Buyer Rate</div>
          <div className="stat-card-value">
            {insights.repeatRate.toFixed(1)}%
          </div>
          <div className="stat-card-subtext">Placed more than 1 order</div>
        </div>
      </div>

      <div className="admin-panel-card" style={{ marginTop: '24px' }}>
        <div className="admin-panel-header">
          <div>
            <h3>Customer Cohort Directory</h3>
            <p>Review customer spend metrics, email registration records, and activity parameters.</p>
          </div>
          <div className="admin-toolbar">
            <input
              className="admin-input"
              placeholder="Search by name, email or ID..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="admin-input"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="totalSpend">Sort by: Total Spend</option>
              <option value="totalOrders">Sort by: Order Count</option>
              <option value="aov">Sort by: Avg Order Value</option>
              <option value="lastPurchase">Sort by: Last Order Date</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">Syncing customer records…</div>
        ) : processedCustomers.length === 0 ? (
          <div className="admin-empty-chart">No customers match search parameters</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer Profile</th>
                  <th>Email Address</th>
                  <th style={{ textAlign: 'center' }}>Total Orders</th>
                  <th style={{ textAlign: 'right' }}>Total Spend</th>
                  <th style={{ textAlign: 'right' }}>Avg Order Value</th>
                  <th>Last Purchase</th>
                  <th style={{ textAlign: 'right' }}>Identity</th>
                </tr>
              </thead>
              <tbody>
                {processedCustomers.map((user) => {
                  const isExpanded = expandedUserId === user.id;
                  
                  return (
                    <React.Fragment key={user.id}>
                      <tr className={isExpanded ? 'row-active' : ''} style={{ backgroundColor: isExpanded ? '#f8fafc' : 'inherit' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="table-user-avatar" style={{ backgroundColor: '#eff6ff', color: '#1d4edf' }}>
                              {getInitials(user.name)}
                            </div>
                            <strong style={{ fontSize: '13px' }}>{user.name}</strong>
                          </div>
                        </td>
                        <td>{user.email || 'N/A'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="status-pill info" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '2px 8px' }}>
                            {user.totalOrders}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                          {formatCurrency(user.totalSpend)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(user.averageOrderValue)}
                        </td>
                        <td>{formatDate(user.lastPurchaseAt)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="admin-secondary-btn compact"
                            onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                          >
                            {isExpanded ? 'Hide ID' : 'View ID'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="user-detail-row">
                          <td colSpan={7} style={{ backgroundColor: '#f8fafc', padding: '16px 24px' }}>
                            <div className="user-detail-drawer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                                Customer Identity Specifications
                              </h4>
                              <div style={{ display: 'flex', gap: '40px', marginTop: '4px' }}>
                                <div>
                                  <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Cognito User ID (sub UUID)
                                  </span>
                                  <code style={{ fontSize: '12px', color: 'var(--admin-text-main)', backgroundColor: '#fff', padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                                    {user.id}
                                  </code>
                                </div>
                                <div>
                                  <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Auth Session Created
                                  </span>
                                  <span style={{ fontSize: '12px', color: 'var(--admin-text-main)' }}>
                                    {formatDate(user.registeredAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCustomers;
